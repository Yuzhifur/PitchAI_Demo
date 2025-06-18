"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { projectApi, scoreApi, reportApi } from "@/lib/api";
import type { Score, MissingInfo } from "@/lib/types";
import Layout from '@/components/Layout';

export default function ProjectReportPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [missingInfo, setMissingInfo] = useState<MissingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, scoresRes, missingInfoRes] = await Promise.all([
          projectApi.getDetail(projectId),
          scoreApi.getScores(projectId),
          scoreApi.getMissingInfo(projectId),
        ]);
        setProject(projectRes.data);
        setScores(scoresRes.data.dimensions);
        setMissingInfo(missingInfoRes.data.items);
      } catch (err: any) {
        setError(err.response?.data?.message || "获取报告失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleDownloadReport = async () => {
    try {
      const response = await reportApi.downloadReport(projectId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `评审报告_${project.project_name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || '下载报告失败');
    }
  };

  // 评分维度图标和配色
  const dimensionMeta: Record<string, { icon: string; color: string; text: string }> = {
    "团队能力": { icon: "fa-users", color: "text-purple-400", text: "text-purple-600" },
    "产品&技术": { icon: "fa-microchip", color: "text-pink-400", text: "text-pink-600" },
    "市场前景": { icon: "fa-chart-line", color: "text-blue-400", text: "text-blue-600" },
    "商业模式": { icon: "fa-briefcase", color: "text-green-400", text: "text-green-600" },
    "财务情况": { icon: "fa-coins", color: "text-yellow-400", text: "text-yellow-600" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto py-12">
            {/* 项目信息卡片 */}
            <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 relative">
              <button
                onClick={handleDownloadReport}
                className="absolute top-6 right-6 px-5 py-2 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-semibold shadow hover:from-purple-600 hover:to-pink-500 transition flex items-center z-10"
              >
                <i className="fa-solid fa-file-arrow-down mr-2"></i> 下载PDF报告
              </button>
              <div className="flex items-center mb-4">
                <div className="text-2xl font-bold text-gray-800 mr-4">{project.project_name}</div>
                <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">{project.enterprise_name}</span>
              </div>
              <div className="text-gray-400 text-sm mb-2">提交时间：{project.created_at?.slice(0, 10)}</div>
              <div className="flex items-center mb-2">
                <span className="text-lg font-bold text-purple-600 mr-4">总分：{project.total_score ?? '--'}/100</span>
                <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs"><i className="fa-solid fa-thumbs-up mr-1"></i> {project.review_result || '评审通过'}</span>
              </div>
              <div className="mb-2">
                <a href="#" className="text-purple-500 hover:underline text-sm flex items-center"><i className="fa-solid fa-file-pdf mr-1"></i> 查看BP文档</a>
              </div>
            </div>
            {/* 评分维度卡片区 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {scores.map((score) => {
                const meta = dimensionMeta[score.dimension] || { icon: "fa-star", color: "text-gray-400", text: "text-gray-600" };
                return (
                  <div key={score.dimension} className="bg-white rounded-2xl shadow p-6 flex flex-col">
                    <div className="flex items-center mb-2">
                      <i className={`fa-solid ${meta.icon} ${meta.color} mr-2`}></i>
                      <span className="font-semibold text-gray-700">{score.dimension}</span>
                      <span className={`ml-auto text-lg font-bold ${meta.text}`}>{score.score}/{score.max_score}</span>
                    </div>
                    <div className="text-gray-500 text-sm mb-2">{score.comments}</div>
                  </div>
                );
              })}
            </div>
            {/* 缺失信息卡片 */}
            <div className="bg-white rounded-2xl shadow p-8">
              <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><i className="fa-solid fa-circle-exclamation text-yellow-400 mr-2"></i> 缺失信息清单</div>
              <ul className="list-disc pl-6 text-gray-500 text-sm space-y-1">
                {missingInfo.length === 0 ? (
                  <li>无缺失信息</li>
                ) : (
                  missingInfo.map((info, idx) => (
                    <li key={idx}>{info.description}</li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </main>
        {/* 引入FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </div>
    </Layout>
  );
}