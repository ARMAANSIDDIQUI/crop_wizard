import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminBlog = () => {
    const navigate = useNavigate();
    const { role, token, isAuthenticated } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (isAuthenticated && role !== 'admin') {
            navigate('/dashboard');
        }
    }, [isAuthenticated, role, navigate]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(null); // Clear previous success messages

        const formData = new FormData();
        formData.append('file', file);

        try {
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}` // Ensure Authorization header is set
            }
        };

            const { data } = await axios.post('/api/upload', formData, config);
            setImageUrl(data.url);
            setSuccess('File uploaded successfully!');
        } catch (err) {
            setError('File upload failed. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!token) {
            setError('Not authenticated.');
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            const blogData = {
                title,
                content,
                imageUrl,
                tags: tags.split(',').map(tag => tag.trim())
            };

            await axios.post('/api/blogs', blogData, config);
            setSuccess('Blog post created successfully!');
            setTitle('');
            setContent('');
            setImageUrl('');
            setTags('');
            setTimeout(() => navigate('/blog'), 1500); // Redirect after success
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create blog post.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative bg-beige-50 min-h-screen overflow-hidden">
            <div className="absolute top-0 -left-24 w-72 h-72 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
            <div className="absolute top-10 -right-24 w-80 h-80 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-lime-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

            <div className="relative max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="bg-white/85 backdrop-blur rounded-3xl shadow-2xl border border-emerald-50 p-10">
                    <div className="text-center mb-8">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">Admin</p>
                        <h2 className="text-3xl font-extrabold text-emerald-900">Create New Blog Post</h2>
                        <p className="text-gray-600 mt-2">Share updates, tips, and research with the community.</p>
                    </div>
                    
                    {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
                    {success && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-1">
                                Blog Title
                            </label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="block w-full px-4 py-3 border border-emerald-100 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter an engaging title"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1">
                                    Upload Image or Video
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                />
                                {uploading && <span className="text-sm text-emerald-600 animate-pulse mt-1 inline-block">Uploading...</span>}
                            </div>

                            <div>
                                <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-800 mb-1">
                                    Image/Video URL (auto-filled on upload)
                                </label>
                                <input
                                    id="imageUrl"
                                    name="imageUrl"
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="block w-full px-4 py-3 border border-emerald-100 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-sm font-semibold text-gray-800 mb-1">
                                Tags (comma separated)
                            </label>
                            <input
                                id="tags"
                                name="tags"
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="block w-full px-4 py-3 border border-emerald-100 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="agriculture, farming, crop tips"
                            />
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-semibold text-gray-800 mb-1">
                                Content
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                rows="10"
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="block w-full px-4 py-3 border border-emerald-100 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Write your blog content here..."
                            ></textarea>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white transition ${
                                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg'
                                }`}
                            >
                                {loading ? 'Publishing...' : 'Publish Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminBlog;
