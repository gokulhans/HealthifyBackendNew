'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { FaEdit, FaTrashAlt, FaSpinner, FaPlus, FaMinus } from 'react-icons/fa';

interface Question {
    _id: string;
    category: string;
    questionNumber: number;
    questionText: string;
    options: string[];
    order: number;
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
        order: initialData?.order?.toString() || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, ''] });
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                category: formData.category,
                questionText: formData.questionText,
                options: formData.options.filter(o => o.trim() !== ''),
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
                <input
                    type="text"
                    name="questionText"
                    value={formData.questionText}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="space-y-2">
                    {formData.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                placeholder={`Option ${idx + 1}`}
                                required
                                className="flex-1 rounded-md border-gray-300 shadow-sm p-2 border"
                            />
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
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleChange}
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

    const tableContent = (
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
                    </button>
                ))}
            </div>

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Text</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
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
                            <tr key={q._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {q.questionNumber}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-sm">
                                    {q.questionText}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <ul className="list-disc list-inside">
                                        {q.options.map((opt, idx) => (
                                            <li key={idx} className="truncate max-w-xs">{opt}</li>
                                        ))}
                                    </ul>
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
    );

    return (
        <CrudLayout
            title="Health Assessment"
            subtitle="Manage assessment questions by category."
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
