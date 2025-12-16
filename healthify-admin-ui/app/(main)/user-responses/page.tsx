'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { FaSpinner, FaChartPie, FaUsers, FaCheckCircle, FaClock, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface CategoryScore {
    totalScore: number;
    maxScore: number;
    answeredCount: number;
    percentage: number;
}

interface Assessment {
    _id: string;
    user: {
        _id: string;
        name?: string;
        email?: string;
    };
    overallScore: {
        percentage: number;
        level: string;
    };
    categoryScores: Record<string, CategoryScore>;
    answeredCount: number;
    isComplete: boolean;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    completionRate: number;
    totalQuestions: number;
    recentAssessments: number;
    questionsByCategory: Record<string, number>;
}

export default function UserResponsesPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

    const fetchStats = useCallback(async () => {
        try {
            const response = await apiFetch<{ data: Stats }>('/health-assessment/admin/stats', 'GET');
            setStats(response.data);
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    const fetchAssessments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '15'
            });

            if (filter === 'completed') queryParams.append('completed', 'true');
            if (filter === 'in-progress') queryParams.append('completed', 'false');

            const response = await apiFetch<{
                data: Assessment[];
                pagination: { page: number; limit: number; total: number; pages: number }
            }>(`/health-assessment/admin/assessments?${queryParams}`, 'GET');

            setAssessments(response.data);
            setTotalPages(response.pagination.pages);
        } catch (err: any) {
            setError(err.message || 'Failed to load assessments.');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'excellent': return 'bg-green-100 text-green-700';
            case 'good': return 'bg-blue-100 text-blue-700';
            case 'fair': return 'bg-yellow-100 text-yellow-700';
            case 'needs improvement': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">User Assessment Responses</h1>
                <p className="text-gray-500 mt-1">View and analyze user health assessment submissions and scores.</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <FaUsers className="text-2xl opacity-80" />
                            <div>
                                <div className="text-2xl font-bold">{stats.totalAssessments}</div>
                                <div className="text-sm opacity-80">Total Submissions</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <FaCheckCircle className="text-2xl text-green-500" />
                            <div>
                                <div className="text-2xl font-bold text-gray-800">{stats.completedAssessments}</div>
                                <div className="text-xs text-gray-500">Completed</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <FaClock className="text-2xl text-yellow-500" />
                            <div>
                                <div className="text-2xl font-bold text-gray-800">{stats.inProgressAssessments}</div>
                                <div className="text-xs text-gray-500">In Progress</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <FaChartPie className="text-2xl text-blue-500" />
                            <div>
                                <div className="text-2xl font-bold text-gray-800">{stats.completionRate}%</div>
                                <div className="text-xs text-gray-500">Completion Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {(['all', 'completed', 'in-progress'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Breakdown</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    <FaSpinner className="animate-spin inline mr-2" /> Loading...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-red-500">{error}</td>
                            </tr>
                        ) : assessments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    No assessments found.
                                </td>
                            </tr>
                        ) : (
                            assessments.map((assessment) => (
                                <tr key={assessment._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {assessment.user?.name || 'Anonymous'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {assessment.user?.email || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="text-lg font-bold text-gray-800">
                                                {assessment.overallScore.percentage}%
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(assessment.overallScore.level)}`}>
                                                {assessment.overallScore.level}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {Object.entries(assessment.categoryScores).map(([cat, score]) => (
                                                <div key={cat} className="text-xs">
                                                    <span className="text-gray-500">{cat.slice(0, 1)}:</span>
                                                    <span className={`ml-1 font-medium ${score.percentage >= 70 ? 'text-green-600' :
                                                            score.percentage >= 50 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                        }`}>
                                                        {score.percentage}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {assessment.isComplete ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <FaCheckCircle size={10} /> Complete
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                <FaClock size={10} /> {assessment.answeredCount} answered
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(assessment.updatedAt)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <FaArrowLeft size={12} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <FaArrowRight size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
