"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { projectApi, businessPlanApi } from "@/lib/api";
import Layout from '@/components/Layout';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    enterprise_name: "",
    project_name: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("请上传PDF文件");
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError("文件大小不能超过20MB");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("请上传BP文档");
      return;
    }
    setLoading(true);
    setError("");
    setUploadProgress(0);
    try {
      // 1. 创建项目
      const projectResponse = await projectApi.create(formData);
      const projectId = projectResponse.data.id;
      // 2. 上传BP文档
      await businessPlanApi.upload(projectId, file);
      // 3. 跳转到项目详情页
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "创建项目失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto py-12">
            <div className="bg-white rounded-3xl shadow-2xl p-10">
              <div className="mb-8">
                <div className="text-2xl font-bold text-gray-800 mb-1 flex items-center">
                  <i className="fa-solid fa-upload text-purple-500 mr-2"></i> 上传BP文档
                </div>
                <div className="text-gray-400">请填写项目信息并上传BP（PDF格式，最大20MB）</div>
              </div>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
              )}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="project_name">项目名称</label>
                  <input
                    id="project_name"
                    name="project_name"
                    type="text"
                    required
                    placeholder="请输入项目名称"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-gray-50 text-gray-800"
                    value={formData.project_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="enterprise_name">企业名称</label>
                  <input
                    id="enterprise_name"
                    name="enterprise_name"
                    type="text"
                    required
                    placeholder="请输入企业名称"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:outline-none bg-gray-50 text-gray-800"
                    value={formData.enterprise_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">BP文档</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 py-8 cursor-pointer hover:bg-purple-100 transition">
                    <i className="fa-solid fa-file-pdf text-4xl text-purple-400 mb-2"></i>
                    <span className="text-gray-500">拖拽文件到此处，或 <span className="text-purple-600 underline cursor-pointer">点击上传</span></span>
                    <span className="text-xs text-gray-400 mt-1">仅支持PDF，最大20MB</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  {file && (
                    <div className="mt-4">
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-gray-500">{file.name}</span>
                        <span className="ml-auto text-xs text-purple-500">100%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-tr from-purple-500 to-pink-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center justify-center disabled:opacity-50"
                >
                  <i className="fa-solid fa-cloud-upload-alt mr-2"></i> {loading ? "提交中..." : "提交"}
                </button>
              </form>
            </div>
          </div>
        </main>
        {/* 引入FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
} 