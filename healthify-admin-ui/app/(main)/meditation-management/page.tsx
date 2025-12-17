'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { useFetchSelectData } from '@/components/hooks/useFetchSelectData';
import { uploadImage, uploadAudio } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner, FaPlayCircle, FaCloudUploadAlt, FaMusic, FaImage } from 'react-icons/fa';

interface CategoryOption {
    value: string; // Category ID
    label: string; // Category Name
}

interface MeditationCategoryRef {
    _id: string;
    name: string;
}

interface Meditation {
    _id: string;
    title: string;
    slug: string;
    description?: string;
    duration: number; // seconds
    category: MeditationCategoryRef;
    audioUrl: string;
    thumbnail?: string;
    createdAt: string;
}

interface MeditationFormProps {
    onSuccess: () => void;
    initialData: Meditation | null;
    onClose: () => void;
}

const MeditationForm: React.FC<MeditationFormProps> = ({ onSuccess, initialData, onClose }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        duration: initialData?.duration || 120,
        category: initialData?.category?._id || '', // Expects category ID
        audioUrl: initialData?.audioUrl || '',
        thumbnail: initialData?.thumbnail || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);

    const { data: categoryOptions, loading: categoriesLoading, error: categoriesError } = useFetchSelectData('/categories', 'name');

    const isEdit = !!initialData;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'duration' ? Number(value) : value,
        }));
    };

    const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingThumbnail(true);
        setError('');
        try {
            const result = await uploadImage(file);
            setFormData(prev => ({ ...prev, thumbnail: result.url }));
        } catch (err: any) {
            setError(err.message || 'Thumbnail upload failed');
        } finally {
            setUploadingThumbnail(false);
        }
    };

    const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAudio(true);
        setError('');
        try {
            const result = await uploadAudio(file);
            setFormData(prev => ({ ...prev, audioUrl: result.url }));
        } catch (err: any) {
            setError(err.message || 'Audio upload failed');
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.category) {
                throw new Error('Please select a category.');
            }
            if (!formData.audioUrl) {
                throw new Error('Please upload or provide an audio URL.');
            }

            const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
            const endpoint = isEdit ? `/meditations/${initialData!._id}` : '/meditations';

            await apiFetch(endpoint, method, formData);

            alert(`Meditation session ${isEdit ? 'updated' : 'created'} successfully!`);
            onSuccess();
            onClose();

        } catch (err: any) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} session.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full" style={{ maxHeight: '80vh' }}>
            <div className="flex-shrink-0 mb-5 border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {isEdit ? <FaEdit className="text-indigo-500" /> : <FaCloudUploadAlt className="text-green-500" />}
                    {isEdit ? 'Edit Meditation Session' : 'Create New Meditation Session'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                    {isEdit ? 'Update details of your meditation.' : 'Add a new meditation session with audio.'}
                </p>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 pb-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-gray-50 focus:bg-white transition-colors"
                                placeholder="e.g. Morning Mindfulness"
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-white"
                                disabled={categoriesLoading}
                            >
                                <option value="">{categoriesLoading ? 'Loading...' : 'Select Category'}</option>
                                {categoriesError && <option disabled>Error loading categories</option>}
                                {categoryOptions.map((option: CategoryOption) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Duration (Seconds) *</label>
                            <input
                                type="number"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                required
                                min={10}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 bg-gray-50 focus:bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Duration in seconds (e.g., 600 = 10 minutes)</p>
                        </div>

                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 bg-gray-50 focus:bg-white transition-colors"
                                placeholder="Describe the meditation session..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Right Column: Media Uploads */}
                    <div className="space-y-4">
                        {/* Audio Upload */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-dashed border-purple-300">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FaMusic className="text-purple-500" /> Audio File *
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    name="audioUrl"
                                    value={formData.audioUrl}
                                    onChange={handleChange}
                                    className="flex-1 text-sm border-gray-300 rounded-md py-1 px-2"
                                    placeholder="Audio URL..."
                                />
                                {formData.audioUrl && (
                                    <a href={formData.audioUrl} target="_blank" className="text-purple-500 text-xs flex items-center hover:underline">
                                        <FaPlayCircle className="mr-1" /> Play
                                    </a>
                                )}
                            </div>
                            <label className="cursor-pointer flex items-center justify-center bg-white border border-purple-300 hover:bg-purple-50 text-gray-700 font-medium py-2 px-4 rounded-md transition text-sm">
                                {uploadingAudio ? <FaSpinner className="animate-spin mr-2" /> : <FaCloudUploadAlt className="mr-2" />}
                                {uploadingAudio ? 'Uploading...' : 'Upload Audio File'}
                                <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={handleAudioFileChange}
                                    disabled={uploadingAudio}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">Supported: MP3, WAV, M4A, OGG (Max 50MB)</p>
                        </div>

                        {/* Audio Preview */}
                        {formData.audioUrl && (
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2">Audio Preview:</p>
                                <audio src={formData.audioUrl} controls className="w-full" />
                            </div>
                        )}

                        {/* Thumbnail Upload */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <FaImage className="text-blue-500" /> Thumbnail Image
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    name="thumbnail"
                                    value={formData.thumbnail}
                                    onChange={handleChange}
                                    className="flex-1 text-sm border-gray-300 rounded-md py-1 px-2"
                                    placeholder="Thumbnail URL..."
                                />
                                {formData.thumbnail && (
                                    <a href={formData.thumbnail} target="_blank" className="text-blue-500 text-xs flex items-center hover:underline">View</a>
                                )}
                            </div>
                            <label className="cursor-pointer flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition text-sm">
                                {uploadingThumbnail ? <FaSpinner className="animate-spin mr-2" /> : <FaCloudUploadAlt className="mr-2" />}
                                {uploadingThumbnail ? 'Uploading...' : 'Upload Thumbnail'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleThumbnailFileChange}
                                    disabled={uploadingThumbnail}
                                />
                            </label>
                        </div>

                        {/* Thumbnail Preview */}
                        {formData.thumbnail && (
                            <div className="mt-2">
                                <img src={formData.thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-gray-200 mt-2 flex justify-end space-x-3 bg-white">
                <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || uploadingAudio || uploadingThumbnail}
                    className="py-2.5 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center"
                >
                    {loading ? <FaSpinner className="animate-spin mr-2" /> : (isEdit ? 'Save Changes' : 'Create Session')}
                </button>
            </div>
        </form>
    );
};

export default function MeditationManagementPage() {
    const [meditations, setMeditations] = useState<Meditation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingMeditation, setEditingMeditation] = useState<Meditation | null>(null);

    const fetchMeditations = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch<{ data: Meditation[] }>(
                '/meditations?limit=100',
                'GET',
            );
            setMeditations(data.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load meditation sessions. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeditations();
    }, []);

    const handleAdd = () => {
        setEditingMeditation(null);
        setShowForm(true);
    };

    const handleEdit = (meditation: Meditation) => {
        setEditingMeditation(meditation);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this meditation session?')) return;

        try {
            await apiFetch(`/meditations/${id}`, 'DELETE');
            alert('Session deleted successfully!');
            fetchMeditations();
        } catch (err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    const handleCloseForm = () => {
        setEditingMeditation(null);
        setShowForm(false);
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m${remainingSeconds ? ` ${remainingSeconds}s` : ''}`;
    };

    const tableContent = (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-gray-500">
                            <FaSpinner className="animate-spin inline mr-2" /> Loading...
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-danger">{error}</td>
                    </tr>
                ) : meditations.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-gray-500">No meditation sessions found. Click 'Add New' to create one.</td>
                    </tr>
                ) : (
                    meditations.map((session) => (
                        <tr key={session._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-medium">{session.category?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(session.duration)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                                <a
                                    href={session.audioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    <FaPlayCircle className="inline mr-1" /> Play Audio
                                </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleEdit(session)}
                                    className="text-secondary hover:text-blue-800 mr-3"
                                >
                                    <FaEdit className="inline" />
                                </button>
                                <button
                                    onClick={() => handleDelete(session._id)}
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
    );

    return (
        <CrudLayout
            title="Meditation Management"
            subtitle="Manage guided meditation sessions with audio files and categories."
            onRefresh={fetchMeditations}
            showForm={showForm}
            setShowForm={setShowForm}
            form={
                <MeditationForm
                    onSuccess={fetchMeditations}
                    initialData={editingMeditation}
                    onClose={handleCloseForm}
                />
            }
        >
            {tableContent}
        </CrudLayout>
    );
}
