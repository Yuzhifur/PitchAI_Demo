import os
import shutil
from datetime import datetime
from fastapi import UploadFile
from typing import Tuple
from ..core.config.settings import settings


class StorageService:
    def __init__(self):
        # 创建上传文件存储目录
        self.upload_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "uploads"
        )
        self.bp_dir = os.path.join(self.upload_dir, "business_plans")
        self._ensure_directories()

    def _ensure_directories(self):
        """确保必要的目录存在"""
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.bp_dir, exist_ok=True)

    async def save_business_plan(
        self, file: UploadFile, project_id: str
    ) -> Tuple[str, str]:
        """
        保存商业计划书文件
        返回: (文件路径, 文件名)
        """
        # 生成文件名: project_id_timestamp_original_filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{project_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(self.bp_dir, filename)

        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return file_path, filename

    def get_file_size(self, file_path: str) -> int:
        """获取文件大小(字节)"""
        return os.path.getsize(file_path)

    def delete_file(self, file_path: str) -> bool:
        """删除文件"""
        try:
            os.remove(file_path)
            return True
        except Exception:
            return False


storage_service = StorageService()
