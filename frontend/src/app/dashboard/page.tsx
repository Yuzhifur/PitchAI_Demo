"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectApi } from "@/lib/api";

interface Project {
  id: string;
  enterprise_name: string;
  project_name: string;
  status: string;
  total_score: number | null;
  review_result: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // mock统计数据
  const stats = [
    { icon: "fa-inbox", color: "from-purple-500 to-pink-400", label: "待评审", value: 5 },
    { icon: "fa-check-circle", color: "from-green-400 to-blue-400", label: "已完成", value: 12 },
    { icon: "fa-exclamation-circle", color: "from-yellow-400 to-orange-400", label: "补充信息待处理", value: 2 },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.list({});
        setProjects(response.data.items);
      } catch (err: any) {
        setError(err.response?.data?.message || "获取项目列表失败");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // 状态标签样式
  const getStatusTag = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">待评审</span>
        );
      case "completed":
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">已完成</span>
        );
      case "pending_info":
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">补充信息</span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">未知</span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)' }}>
      {/* 顶部品牌栏 */}
      <header className="w-full py-4 px-8 bg-white shadow flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-extrabold bg-gradient-to-tr from-purple-500 to-pink-400 bg-clip-text text-transparent tracking-wide mr-2">PitchAI</span>
        </div>
        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=facearea&w=96&h=96&facepad=2" alt="avatar" className="w-10 h-10 rounded-full border shadow" />
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto py-12">
          {/* 欢迎区和统计卡片 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center mr-3 shadow">
                <i className="fa-solid fa-brain text-white text-2xl"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 mb-1">欢迎回来，评审专家！</div>
                <div className="text-gray-400">快速查看您的评审任务和项目进展</div>
              </div>
            </div>
            <button 
              onClick={() => router.push('/projects/new')} 
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              新建项目
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow flex items-center p-6 transition hover:shadow-xl">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr ${stat.color} text-white text-2xl mr-4`}>
                  <i className={`fa-solid ${stat.icon}`}></i>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* 最近项目表格卡片 */}
          <div className="bg-white rounded-2xl shadow p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-gray-700">最近项目</div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="py-2">项目名称</th>
                  <th className="py-2">企业名称</th>
                  <th className="py-2">状态</th>
                  <th className="py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">加载中...</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">暂无项目数据</td></tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{project.project_name}</td>
                      <td className="py-3 text-gray-600">{project.enterprise_name}</td>
                      <td className="py-3">{getStatusTag(project.status)}</td>
                      <td className="py-3">
                        <button onClick={() => router.push(`/projects/${project.id}`)} className="text-purple-500 hover:underline text-sm">查看</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <footer className="w-full py-4 text-center text-gray-400 text-sm">© 2024 PitchAI</footer>
      {/* 引入FontAwesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
} 