from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
import uuid
from datetime import datetime
from ...models.business_plan import (
    BusinessPlanCreate,
    BusinessPlanInDB,
    BusinessPlanStatus,
)
from ...services.storage import storage_service
from ...services.document.processor import document_processor
from ...services.evaluation.deepseek_client import deepseek_client
from ...core.database import db

router = APIRouter()


async def process_business_plan_async(bp_id: str, file_path: str, project_id: str):
    """Background task to process the business plan - simplified for manual review"""
    supabase = db.get_client()

    try:
        print(f"🔄 Starting simplified processing for BP {bp_id}")

        # Update status to processing
        supabase.table("business_plans").update({
            "status": BusinessPlanStatus.PROCESSING.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", bp_id).execute()

        # FIXED: Just verify file exists, skip document processing
        if not storage_service.file_exists(file_path):
            raise FileNotFoundError(f"Business plan file not found: {file_path}")

        # FIXED: Skip document processing and AI evaluation
        # Just mark as completed and ready for manual review
        print(f"📄 File verified and ready for manual review: {file_path}")

        # Update business plan status to completed
        supabase.table("business_plans").update({
            "status": BusinessPlanStatus.COMPLETED.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", bp_id).execute()

        # FIXED: Set project to pending_review for manual evaluation
        supabase.table("projects").update({
            "status": "pending_review",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", project_id).execute()

        print(f"✅ Business plan upload completed for {bp_id} - ready for manual review")

    except Exception as e:
        print(f"❌ Business plan processing failed for {bp_id}: {e}")

        # Update status to failed
        supabase.table("business_plans").update({
            "status": BusinessPlanStatus.FAILED.value,
            "error_message": str(e),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", bp_id).execute()

        # Keep project in pending_review state even if file processing fails
        supabase.table("projects").update({
            "status": "pending_review",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", project_id).execute()


# REMOVED: Default evaluation creation - projects will be manually reviewed


@router.post("/projects/{project_id}/business-plans", response_model=BusinessPlanInDB)
async def upload_business_plan(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """上传商业计划书"""
    supabase = db.get_client()

    # FIXED: Add comprehensive input validation
    try:
        # Validate project exists
        project_result = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="只支持PDF文件")

        # Check file size (before reading content)
        file_size = 0
        if hasattr(file, 'size') and file.size:
            file_size = file.size
        else:
            # Read content to get size
            content = await file.read()
            file_size = len(content)
            # Reset file position
            await file.seek(0)

        if file_size > 20 * 1024 * 1024:  # 20MB
            raise HTTPException(status_code=400, detail="文件大小不能超过20MB")

        if file_size == 0:
            raise HTTPException(status_code=400, detail="文件不能为空")

        print(f"📤 Uploading BP for project {project_id}: {file.filename} ({file_size} bytes)")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件验证失败: {str(e)}")

    # Save file
    try:
        file_path, filename = await storage_service.save_business_plan(file, project_id)
        actual_file_size = storage_service.get_file_size(file_path)

    except Exception as e:
        print(f"❌ File save failed: {e}")
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")

    # Create BP record in database
    try:
        bp_id = str(uuid.uuid4())
        bp_data = {
            "id": bp_id,
            "project_id": project_id,
            "file_name": filename,
            "file_size": actual_file_size,
            "status": BusinessPlanStatus.PROCESSING.value,
            "upload_time": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("business_plans").insert(bp_data).execute()

        if not result.data:
            # Clean up uploaded file
            storage_service.delete_file(file_path)
            raise HTTPException(status_code=500, detail="保存BP记录失败")

        bp_record = BusinessPlanInDB(**result.data[0])

    except HTTPException:
        raise
    except Exception as e:
        # Clean up uploaded file
        storage_service.delete_file(file_path)
        raise HTTPException(status_code=500, detail=f"数据库操作失败: {str(e)}")

    # FIXED: Start background processing
    try:
        background_tasks.add_task(
            process_business_plan_async,
            bp_id,
            file_path,
            project_id
        )
        print(f"⚡ Background processing started for BP {bp_id}")

    except Exception as e:
        print(f"⚠️ Failed to start background processing: {e}")
        # Don't fail the upload, just log the warning

    return bp_record


@router.get("/projects/{project_id}/business-plans/status", response_model=BusinessPlanInDB)
async def get_business_plan_status(project_id: str):
    """获取BP处理状态"""
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Get the latest business plan for this project
        result = (
            supabase.table("business_plans")
            .select("*")
            .eq("project_id", project_id)
            .order("upload_time", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="未找到BP记录")

        return BusinessPlanInDB(**result.data[0])

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取BP状态失败: {str(e)}")


@router.get("/projects/{project_id}/business-plans/download")
async def download_business_plan(project_id: str):
    """下载BP文档"""
    from fastapi.responses import FileResponse

    supabase = db.get_client()

    try:
        # Get the latest business plan for this project
        result = (
            supabase.table("business_plans")
            .select("*")
            .eq("project_id", project_id)
            .order("upload_time", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="未找到BP文档")

        bp_record = result.data[0]

        # Construct file path (this assumes a standard naming pattern)
        file_path = storage_service.bp_dir / bp_record['file_name']

        if not storage_service.file_exists(str(file_path)):
            raise HTTPException(status_code=404, detail="BP文档文件不存在")

        return FileResponse(
            path=str(file_path),
            filename=f"{bp_record['file_name']}",
            media_type='application/pdf'
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载BP文档失败: {str(e)}")