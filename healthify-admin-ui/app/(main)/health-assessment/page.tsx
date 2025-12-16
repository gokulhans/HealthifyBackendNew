'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { FaEdit, FaTrashAlt, FaSpinner, FaPlus, FaMinus, FaChartBar, FaInfoCircle } from 'react-icons/fa';

interface Question {
    _id: string;
    category: string;
    questionNumber: number;
    questionText: string;
    options: string[];
    optionScores?: number[];
    order: number;
    isActive?: boolean;
}

interface QuestionFormProps {
    onSuccess: () => void;
    initialData: Question | null;
    onClose: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onSuccess, initialData, onClose }) => {
    const [formData, setFormData] = useState({
        category: initialData?.category || 'Body',
        questionText: initialData?.questionText || '',
        options: initialData?.options || ['', ''],
        optionScores: initialData?.optionScores || [0, 0],
        order: initialData?.order?.toString() || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScores, setShowScores] = useState(
        initialData?.optionScores && initialData.optionScores.some(s => s !== 0)
    );

    const isEdit = !!initialData;
    const categories = ['Body', 'Mind', 'Nutrition', 'Lifestyle'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleScoreChange = (index: number, value: string) => {
        const newScores = [...formData.optionScores];
        newScores[index] = parseInt(value) || 0;
        setFormData({ ...formData, optionScores: newScores });
    };

    const addOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, ''],
            optionScores: [...formData.optionScores, 0]
        });
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        const newOptions = formData.options.filter((_, i) => i !== index);
        const newScores = formData.optionScores.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions, optionScores: newScores });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const validOptions = formData.options.filter(o => o.trim() !== '');
            const validScores = formData.optionScores.slice(0, validOptions.length);

            const payload = {
                category: formData.category,
                questionText: formData.questionText,
                options: validOptions,
                optionScores: showScores ? validScores : validOptions.map((_, i) => i), // Default: index-based scoring
                order: Number(formData.order) || 0,
            };

            if (payload.options.length < 2) {
                throw new Error('Please provide at least 2 valid options');
            }

            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/health-assessment/questions/${initialData!._id}` : '/health-assessment/questions';

            await apiFetch(endpoint, method, payload);

            alert(`Question ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} question.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-primary">
                {isEdit ? 'Edit Question' : 'Add New Question'}
            </h3>

            {error && <p className="text-danger mb-4 p-2 bg-red-50 rounded">{error}</p>}

            <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Question Text</label>
                <textarea
                    name="questionText"
                    value={formData.questionText}
                    onChange={handleChange}
                    required
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Options</label>
                    <button
                        type="button"
                        onClick={() => setShowScores(!showScores)}
                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${showScores ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <FaChartBar size={10} />
                        {showScores ? 'Hide Scores' : 'Show Scores'}
                    </button>
                </div>

                {showScores && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700 flex items-start gap-2">
                        <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                        <span>
                            Assign scores to each option (0-10). Higher scores indicate better/healthier choices.
                            These scores are used to calculate the user's health assessment results.
                        </span>
                    </div>
                )}

                <div className="space-y-2">
                    {formData.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                            <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                placeholder={`Option ${idx + 1}`}
                                required
                                className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border"
                            />
                            {showScores && (
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formData.optionScores[idx] || 0}
                                    onChange={(e) => handleScoreChange(idx, e.target.value)}
                                    className="w-16 rounded-md border-gray-300 shadow-sm p-2 border text-center"
                                    title="Score (0-10)"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => removeOption(idx)}
                                disabled={formData.options.length <= 2}
                                className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                                <FaMinus />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-primary flex items-center gap-1 hover:underline mt-2"
                    >
                        <FaPlus size={12} /> Add Option
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Display Order</label>
                <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder="Auto-assigned if empty"
                    className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm p-2 border"
                />
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 flex items-center"
                >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
                    {isEdit ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
};

export default function HealthAssessmentPage() {
    const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, Question[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('Body');
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const categories = ['Body', 'Mind', 'Nutrition', 'Lifestyle'];

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiFetch<{ data: Record<string, Question[]> }>('/health-assessment/questions', 'GET');
            setQuestionsByCategory(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load questions.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            await apiFetch(`/health-assessment/questions/${id}`, 'DELETE');
            fetchQuestions();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingQuestion(null);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingQuestion(null);
    };

    const questions = questionsByCategory[activeCategory] || [];

    // Calculate total questions stats
    const totalQuestions = Object.values(questionsByCategory).reduce((sum, q) => sum + q.length, 0);
    const categoryStats = categories.map(cat => ({
        name: cat,
        count: (questionsByCategory[cat] || []).length
    }));

    const tableContent = (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-lg p-4">
                    <div className="text-2xl font-bold">{totalQuestions}</div>
                    <div className="text-sm opacity-80">Total Questions</div>
                </div>
                {categoryStats.map(stat => (
                    <div key={stat.name} className="bg-white border rounded-lg p-4">
                        <div className="text-xl font-bold text-gray-800">{stat.count}</div>
                        <div className="text-xs text-gray-500">{stat.name}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200 bg-gray-50">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeCategory === cat
                                ? 'border-b-2 border-primary text-primary bg-white'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {cat}
                            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                {(questionsByCategory[cat] || []).length}
                            </span>
                        </button>
                    ))}
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Text</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options & Scores</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                <td colSpan={5} className="text-center py-8 text-danger">{error}</td>
                            </tr>
                        ) : questions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    No questions found for {activeCategory}. Click 'Add New' to create one.
                                </td>
                            </tr>
                        ) : (
                            questions.map((q) => (
                                <tr key={q._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {q.questionNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-sm">
                                        {q.questionText}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="space-y-1">
                                            {q.options.map((opt, idx) => {
                                                const score = q.optionScores?.[idx] ?? idx;
                                                return (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <span className="truncate max-w-xs">{opt}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${score >= 3 ? 'bg-green-100 text-green-700' :
                                                                score >= 2 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {score}pts
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.order}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(q)}
                                            className="text-secondary hover:text-blue-800 mr-3"
                                        >
                                            <FaEdit className="inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q._id)}
                                            className="text-danger hover:text-red-800"
                                        >
                                            <FaTrashAlt className="inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <CrudLayout
            title="Health Assessment"
            subtitle="Manage assessment questions and scoring by category. Scores determine user health recommendations."
            onRefresh={fetchQuestions}
            showForm={showForm}
            setShowForm={setShowForm}
            form={
                <QuestionForm
                    initialData={editingQuestion}
                    onSuccess={fetchQuestions}
                    onClose={handleCloseForm}
                />
            }
        >
            {tableContent}
        </CrudLayout>
    );
}
