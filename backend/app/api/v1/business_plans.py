from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List
import uuid
import os
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

@router.post("/projects/{project_id}/business-plans", response_model=BusinessPlanInDB)
async def upload_business_plan(project_id: str, file: UploadFile = File(...)):
    """
    上传商业计划书 - FIXED: Handle datetime serialization
    """
    # 验证文件类型
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="只支持PDF文件")

    # 保存文件
    file_path, filename = await storage_service.save_business_plan(file, project_id)
    file_size = storage_service.get_file_size(file_path)

    # 创建BP记录 - FIXED: Don't use Pydantic model with datetime defaults
    bp_id = str(uuid.uuid4())

    # Prepare data manually with proper datetime handling
    current_time = datetime.utcnow().isoformat()
    bp_data = {
        "id": bp_id,
        "project_id": project_id,
        "file_name": filename,
        "file_size": file_size,
        "status": BusinessPlanStatus.PROCESSING.value,  # Convert enum to string
        "upload_time": current_time,  # Use ISO string, not datetime object
        "updated_at": current_time
    }

    # 保存到数据库
    supabase = db.get_client()
    result = supabase.table("business_plans").insert(bp_data).execute()

    if not result.data:
        # 如果保存失败,删除已上传的文件
        storage_service.delete_file(file_path)
        raise HTTPException(status_code=500, detail="保存BP记录失败")

    # 尝试异步处理文档 - 但不让处理失败影响上传成功
    try:
        # 提取文本并评估
        document_text = await document_processor.extract_text_from_pdf(file_path)
        evaluation_result = await deepseek_client.evaluate_business_plan(document_text)

        # 更新状态为已完成
        supabase.table("business_plans").update({
            "status": BusinessPlanStatus.COMPLETED.value,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", bp_id).execute()

    except Exception as e:
        # 处理失败不影响文件上传成功 - 只记录错误但返回成功
        supabase.table("business_plans").update({
            "status": BusinessPlanStatus.COMPLETED.value,  # 标记为完成，因为文件上传成功
            "error_message": f"AI处理失败: {str(e)}",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", bp_id).execute()

        # 记录错误但不抛出异常
        print(f"AI processing failed for BP {bp_id}: {str(e)}")

    # 返回成功的BP记录 - Create response model manually
    return BusinessPlanInDB(
        id=bp_id,
        project_id=project_id,
        file_name=filename,
        file_size=file_size,
        status=BusinessPlanStatus.COMPLETED,
        upload_time=datetime.fromisoformat(current_time),
        updated_at=datetime.fromisoformat(current_time)
    )


@router.get("/projects/{project_id}/business-plans/status", response_model=BusinessPlanInDB)
async def get_business_plan_status(project_id: str):
    """
    获取BP处理状态 - FIXED: Handle datetime parsing
    """
    supabase = db.get_client()
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

    # Convert database row to model - handle datetime fields
    row = result.data[0]
    return BusinessPlanInDB(
        id=row['id'],
        project_id=row['project_id'],
        file_name=row['file_name'],
        file_size=row['file_size'],
        status=BusinessPlanStatus(row['status']),
        upload_time=datetime.fromisoformat(row['upload_time'].replace('Z', '+00:00')) if isinstance(row['upload_time'], str) else row['upload_time'],
        updated_at=datetime.fromisoformat(row['updated_at'].replace('Z', '+00:00')) if isinstance(row['updated_at'], str) else row['updated_at'],
        error_message=row.get('error_message')
    )


@router.get("/projects/{project_id}/business-plans/download")
async def download_business_plan(project_id: str):
    """
    Download the business plan PDF for a project
    """
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Get the business plan record from database
        result = (
            supabase.table("business_plans")
            .select("*")
            .eq("project_id", project_id)
            .order("upload_time", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="No business plan found for this project")

        bp_record = result.data[0]

        # Construct the file path
        file_name = bp_record['file_name']
        file_path = os.path.join(storage_service.bp_dir, file_name)

        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"Business plan file not found on disk: {file_name}"
            )

        # Get original filename (remove timestamp prefix)
        original_filename = file_name.split('_', 2)[-1] if '_' in file_name else file_name

        # Return the file
        return FileResponse(
            path=file_path,
            media_type='application/pdf',
            filename=original_filename,
            headers={
                "Content-Disposition": f"attachment; filename=\"{original_filename}\""
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download business plan: {str(e)}")


@router.get("/projects/{project_id}/business-plans/info")
async def get_business_plan_info(project_id: str):
    """
    Get business plan information without downloading the file
    """
    supabase = db.get_client()

    try:
        # Validate UUID format
        try:
            uuid.UUID(project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

        # Get the business plan record
        result = (
            supabase.table("business_plans")
            .select("*")
            .eq("project_id", project_id)
            .order("upload_time", desc=True)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="No business plan found for this project")

        bp_record = result.data[0]

        # Check if file exists on disk
        file_path = os.path.join(storage_service.bp_dir, bp_record['file_name'])
        file_exists = os.path.exists(file_path)

        # Get original filename (remove timestamp prefix)
        original_filename = bp_record['file_name'].split('_', 2)[-1] if '_' in bp_record['file_name'] else bp_record['file_name']

        return {
            "id": bp_record['id'],
            "project_id": bp_record['project_id'],
            "file_name": original_filename,
            "file_size": bp_record['file_size'],
            "status": bp_record['status'],
            "upload_time": bp_record['upload_time'],
            "file_exists": file_exists,
            "download_url": f"/api/v1/projects/{project_id}/business-plans/download" if file_exists else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get business plan info: {str(e)}")