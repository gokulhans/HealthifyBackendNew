'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner, FaCopy, FaEye, FaPlus, FaSave, FaTimes, FaCheck } from 'react-icons/fa';

interface Exercise {
    _id: string;
    title: string;
    slug: string;
    difficulty: string;
    duration: number;
    image?: string;
}

interface DayExercise {
    exercise: string | { _id: string; title: string; difficulty?: string; image?: string };
    reps: number;
    sets: number;
    duration: number;
    notes: string;
}

interface BundleDay {
    day: number;
    isRestDay: boolean;
    title: string;
    exercises: DayExercise[];
}

interface ExerciseBundle {
    _id: string;
    name: string;
    slug: string;
    description: string;
    thumbnail: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    totalDays: number;
    schedule: BundleDay[];
    isPublished: boolean;
    totalExercises: number;
    restDays: number;
    createdAt: string;
}

// Grid Editor Component for the Day x Exercise matrix
function ScheduleGridEditor({
    exercises,
    totalDays,
    schedule,
    onScheduleChange,
}: {
    exercises: Exercise[];
    totalDays: number;
    schedule: BundleDay[];
    onScheduleChange: (schedule: BundleDay[]) => void;
}) {
    // Helper to get day data
    const getDayData = (dayNum: number): BundleDay => {
        return schedule.find(d => d.day === dayNum) || {
            day: dayNum,
            isRestDay: false,
            title: '',
            exercises: []
        };
    };

    // Helper to get exercise reps for a day
    const getExerciseReps = (dayNum: number, exerciseId: string): number | null => {
        const day = getDayData(dayNum);
        if (day.isRestDay) return null;
        const ex = day.exercises.find(e => {
            const id = typeof e.exercise === 'string' ? e.exercise : e.exercise._id;
            return id === exerciseId;
        });
        return ex ? ex.reps : 0;
    };

    // Helper to get exercise sets for a day
    const getExerciseSets = (dayNum: number, exerciseId: string): number => {
        const day = getDayData(dayNum);
        const ex = day.exercises.find(e => {
            const id = typeof e.exercise === 'string' ? e.exercise : e.exercise._id;
            return id === exerciseId;
        });
        return ex ? ex.sets : 1;
    };

    // Update exercise for a day
    const updateExercise = (dayNum: number, exerciseId: string, reps: number, sets: number = 1) => {
        const newSchedule = [...schedule];
        let dayIndex = newSchedule.findIndex(d => d.day === dayNum);

        if (dayIndex === -1) {
            newSchedule.push({
                day: dayNum,
                isRestDay: false,
                title: '',
                exercises: []
            });
            dayIndex = newSchedule.length - 1;
        }

        const day = newSchedule[dayIndex];
        const exIndex = day.exercises.findIndex(e => {
            const id = typeof e.exercise === 'string' ? e.exercise : e.exercise._id;
            return id === exerciseId;
        });

        if (reps > 0) {
            if (exIndex === -1) {
                day.exercises.push({ exercise: exerciseId, reps, sets, duration: 0, notes: '' });
            } else {
                day.exercises[exIndex].reps = reps;
                day.exercises[exIndex].sets = sets;
            }
        } else {
            if (exIndex !== -1) {
                day.exercises.splice(exIndex, 1);
            }
        }

        newSchedule.sort((a, b) => a.day - b.day);
        onScheduleChange(newSchedule);
    };

    // Toggle rest day
    const toggleRestDay = (dayNum: number) => {
        const newSchedule = [...schedule];
        let dayIndex = newSchedule.findIndex(d => d.day === dayNum);

        if (dayIndex === -1) {
            newSchedule.push({
                day: dayNum,
                isRestDay: true,
                title: 'Rest Day',
                exercises: []
            });
        } else {
            newSchedule[dayIndex].isRestDay = !newSchedule[dayIndex].isRestDay;
            if (newSchedule[dayIndex].isRestDay) {
                newSchedule[dayIndex].title = 'Rest Day';
                newSchedule[dayIndex].exercises = [];
            } else {
                newSchedule[dayIndex].title = '';
            }
        }

        newSchedule.sort((a, b) => a.day - b.day);
        onScheduleChange(newSchedule);
    };

    // Update day title
    const updateDayTitle = (dayNum: number, title: string) => {
        const newSchedule = [...schedule];
        let dayIndex = newSchedule.findIndex(d => d.day === dayNum);

        if (dayIndex === -1) {
            newSchedule.push({
                day: dayNum,
                isRestDay: false,
                title,
                exercises: []
            });
        } else {
            newSchedule[dayIndex].title = title;
        }

        onScheduleChange(newSchedule);
    };

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="sticky left-0 bg-gray-100 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[180px] border-r border-gray-200">
                            Exercise
                        </th>
                        {days.map(day => {
                            const dayData = getDayData(day);
                            return (
                                <th key={day} className="px-2 py-2 text-center min-w-[100px] border-r border-gray-200">
                                    <div className="text-xs font-semibold text-gray-600">Day {day}</div>
                                    <input
                                        type="text"
                                        placeholder="Title..."
                                        value={dayData.title}
                                        onChange={(e) => updateDayTitle(day, e.target.value)}
                                        className="mt-1 w-full text-xs px-1 py-0.5 border border-gray-200 rounded text-center"
                                    />
                                    <label className="flex items-center justify-center mt-1 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={dayData.isRestDay}
                                            onChange={() => toggleRestDay(day)}
                                            className="mr-1"
                                        />
                                        Rest
                                    </label>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {exercises.map((exercise) => (
                        <tr key={exercise._id} className="hover:bg-gray-50">
                            <td className="sticky left-0 bg-white px-4 py-2 border-r border-gray-200">
                                <div className="flex items-center gap-2">
                                    {exercise.image && (
                                        <img src={exercise.image} alt="" className="w-8 h-8 rounded object-cover" />
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{exercise.title}</div>
                                        <div className="text-xs text-gray-500 capitalize">{exercise.difficulty}</div>
                                    </div>
                                </div>
                            </td>
                            {days.map(day => {
                                const dayData = getDayData(day);
                                const reps = getExerciseReps(day, exercise._id);
                                const sets = getExerciseSets(day, exercise._id);

                                if (dayData.isRestDay) {
                                    return (
                                        <td key={day} className="px-2 py-2 text-center bg-gray-100 border-r border-gray-200">
                                            <span className="text-xs text-gray-400">-</span>
                                        </td>
                                    );
                                }

                                return (
                                    <td key={day} className="px-2 py-2 text-center border-r border-gray-200">
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                <span className="text-[10px] text-gray-500 block">Reps</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={reps || ''}
                                                    onChange={(e) => updateExercise(day, exercise._id, parseInt(e.target.value) || 0, sets)}
                                                    className="w-full text-sm px-2 py-1 border border-gray-300 rounded text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-gray-500 block">Sets</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="1"
                                                    value={sets}
                                                    onChange={(e) => updateExercise(day, exercise._id, reps || 0, parseInt(e.target.value) || 1)}
                                                    className="w-full text-sm px-2 py-1 border border-gray-300 rounded text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Bundle Form with Grid Editor
function BundleForm({
    initialData,
    exercises,
    onSuccess,
    onClose,
}: {
    initialData: ExerciseBundle | null;
    exercises: Exercise[];
    onSuccess: () => void;
    onClose: () => void;
}) {
    const isEdit = !!initialData;

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        thumbnail: initialData?.thumbnail || '',
        difficulty: initialData?.difficulty || 'beginner',
        totalDays: initialData?.totalDays || 7,
        isPublished: initialData?.isPublished || false,
    });

    const [schedule, setSchedule] = useState<BundleDay[]>(initialData?.schedule || []);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'schedule'>('details');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadImage(file);
            setFormData(prev => ({ ...prev, thumbnail: result.url }));
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const method = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/exercise-bundles/${initialData!._id}` : '/exercise-bundles';

            await apiFetch(endpoint, method, {
                ...formData,
                schedule
            });

            alert(`Bundle ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save bundle');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-h-[85vh] overflow-hidden flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-primary flex-shrink-0">
                {isEdit ? 'Edit Exercise Program' : 'Create Exercise Program'}
            </h3>

            {error && <p className="text-danger mb-4 p-2 bg-red-100 rounded">{error}</p>}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
                <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'details'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Details
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'schedule'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Schedule Grid
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'details' && (
                        <div className="space-y-4 pr-2">
                            <label className="block">
                                <span className="text-gray-700">Program Name *</span>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-gray-700">Total Days *</span>
                                    <input
                                        type="number"
                                        name="totalDays"
                                        min="1"
                                        max="90"
                                        value={formData.totalDays}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-gray-700">Difficulty</span>
                                    <select
                                        name="difficulty"
                                        value={formData.difficulty}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </label>
                            </div>

                            <label className="block">
                                <span className="text-gray-700">Thumbnail</span>
                                <input
                                    type="url"
                                    name="thumbnail"
                                    value={formData.thumbnail}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                                />
                                <div className="mt-2 flex items-center gap-3 text-sm">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailUpload}
                                        disabled={uploading}
                                        className="text-sm"
                                    />
                                    {uploading && (
                                        <span className="text-gray-500 flex items-center">
                                            <FaSpinner className="animate-spin inline mr-1" /> Uploading...
                                        </span>
                                    )}
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-gray-700">Description</span>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"
                                ></textarea>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                                />
                                <span className="text-gray-700">Published (visible to users)</span>
                            </label>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="pr-2">
                            <p className="text-sm text-gray-600 mb-3">
                                Enter reps for each exercise on each day. 0 or empty = exercise not included that day.
                                Check &quot;Rest&quot; to mark a day as rest day.
                            </p>
                            <ScheduleGridEditor
                                exercises={exercises}
                                totalDays={formData.totalDays}
                                schedule={schedule}
                                onScheduleChange={setSchedule}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="py-2 px-4 bg-primary text-white rounded-md font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? <FaSpinner className="animate-spin inline mr-2" /> : <FaSave className="inline mr-2" />}
                        {isEdit ? 'Update Program' : 'Create Program'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// Main Page Component
export default function ExerciseProgramsPage() {
    const [bundles, setBundles] = useState<ExerciseBundle[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingBundle, setEditingBundle] = useState<ExerciseBundle | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchExercises = useCallback(async () => {
        try {
            const res = await apiFetch<{ data: Exercise[] }>('/exercises?limit=1000', 'GET');
            setExercises(res.data || []);
        } catch (err) {
            console.error('Failed to load exercises', err);
        }
    }, []);

    const fetchBundles = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const query = new URLSearchParams();
            query.set('page', String(page));
            query.set('limit', '10');
            if (search.trim()) {
                query.set('q', search.trim());
            }

            const data = await apiFetch<{ page: number; pages: number; data: ExerciseBundle[] }>(
                `/exercise-bundles?${query.toString()}`,
                'GET'
            );
            setBundles(data.data);
            setTotalPages(data.pages || 1);
        } catch (err: any) {
            setError(err.message || 'Failed to load exercise programs.');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchExercises();
    }, [fetchExercises]);

    useEffect(() => {
        fetchBundles();
    }, [fetchBundles]);

    const handleAdd = () => {
        setEditingBundle(null);
        setShowForm(true);
    };

    const handleEdit = (bundle: ExerciseBundle) => {
        setEditingBundle(bundle);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this program? This cannot be undone.')) return;

        try {
            await apiFetch(`/exercise-bundles/${id}`, 'DELETE');
            alert('Program deleted successfully!');
            fetchBundles();
        } catch (err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await apiFetch(`/exercise-bundles/${id}/duplicate`, 'POST');
            alert('Program duplicated successfully!');
            fetchBundles();
        } catch (err: any) {
            alert(`Duplication failed: ${err.message}`);
        }
    };

    const handleTogglePublish = async (id: string) => {
        try {
            await apiFetch(`/exercise-bundles/${id}/publish`, 'PATCH');
            fetchBundles();
        } catch (err: any) {
            alert(`Failed to toggle publish status: ${err.message}`);
        }
    };

    const handleCloseForm = () => {
        setEditingBundle(null);
        setShowForm(false);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Exercise Programs</h1>
                    <p className="text-sm text-gray-600">
                        Create multi-day exercise programs with exercises assigned to specific days.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchBundles}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-green-600 flex items-center gap-2"
                    >
                        <FaPlus /> Add New Program
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search programs..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercises</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                    <FaSpinner className="animate-spin inline mr-2" /> Loading...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-red-500">{error}</td>
                            </tr>
                        ) : bundles.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                    No exercise programs found. Click &apos;Add New Program&apos; to create one.
                                </td>
                            </tr>
                        ) : (
                            bundles.map((bundle, index) => (
                                <tr key={bundle._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {(page - 1) * 10 + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {bundle.thumbnail && (
                                                <img src={bundle.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{bundle.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{bundle.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {bundle.totalDays} days
                                        <span className="text-xs text-gray-400 ml-1">
                                            ({bundle.restDays || 0} rest)
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {bundle.totalExercises || 0} exercises
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${bundle.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                            bundle.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {bundle.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleTogglePublish(bundle._id)}
                                            className={`px-2 py-1 text-xs rounded-full ${bundle.isPublished
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {bundle.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(bundle)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(bundle._id)}
                                            className="text-gray-600 hover:text-gray-800 mr-3"
                                            title="Duplicate"
                                        >
                                            <FaCopy />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(bundle._id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete"
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <span>Page {totalPages === 0 ? 0 : page} of {totalPages}</span>
                <div className="space-x-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => p < totalPages ? p + 1 : p)}
                        disabled={page >= totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                        <div className="p-6">
                            <BundleForm
                                initialData={editingBundle}
                                exercises={exercises}
                                onSuccess={fetchBundles}
                                onClose={handleCloseForm}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
