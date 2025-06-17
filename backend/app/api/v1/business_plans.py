from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import uuid
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
    上传商业计划书
    """
    # 验证文件类型
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="只支持PDF文件")

    # 保存文件
    file_path, filename = await storage_service.save_business_plan(file, project_id)
    file_size = storage_service.get_file_size(file_path)

    # 创建BP记录
    bp_id = str(uuid.uuid4())
    bp_data = BusinessPlanCreate(
        project_id=project_id, file_name=filename, file_size=file_size
    )

    # 保存到数据库
    supabase = db.get_client()
    result = (
        supabase.table("business_plans")
        .insert({"id": bp_id, **bp_data.model_dump()})
        .execute()
    )

    if not result.data:
        # 如果保存失败,删除已上传的文件
        storage_service.delete_file(file_path)
        raise HTTPException(status_code=500, detail="保存BP记录失败")

    # 异步处理文档
    try:
        # 提取文本并评估
        document_text = await document_processor.extract_text_from_pdf(file_path)
        evaluation_result = await deepseek_client.evaluate_business_plan(document_text)

        # 更新状态为已完成
        supabase.table("business_plans").update(
            {"status": BusinessPlanStatus.COMPLETED}
        ).eq("id", bp_id).execute()

    except Exception as e:
        # 更新状态为失败
        supabase.table("business_plans").update(
            {"status": BusinessPlanStatus.FAILED, "error_message": str(e)}
        ).eq("id", bp_id).execute()
        raise HTTPException(status_code=500, detail=f"处理BP文档失败: {str(e)}")

    return BusinessPlanInDB(id=bp_id, **bp_data.model_dump())

@router.get(
    "/projects/{project_id}/business-plans/status", response_model=BusinessPlanInDB
)
async def get_business_plan_status(project_id: str):
    """
    获取BP处理状态
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

    return BusinessPlanInDB(**result.data[0])