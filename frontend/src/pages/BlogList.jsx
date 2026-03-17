import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BlogList = () => {
    const { role } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await axios.get('/api/blogs');
                setBlogs(response.data);
            } catch (err) {
                setError('Failed to fetch blogs.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading blogs...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="relative bg-beige-50 min-h-screen overflow-hidden">
            {/* Decorative blobs to match home/dashboard styling */}
            <div className="absolute top-0 -left-24 w-72 h-72 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
            <div className="absolute top-10 -right-24 w-80 h-80 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-lime-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

            <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                    <div>
                        <p className="uppercase tracking-wide text-emerald-600 text-xs font-semibold">Insights</p>
                        <h1 className="text-4xl font-extrabold text-emerald-900">Crop Insights & News</h1>
                        <p className="text-gray-600 mt-2 max-w-2xl">Curated updates, research bites, and how-tos for better harvests.</p>
                    </div>
                    {role === 'admin' && (
                        <Link
                            to="/admin/blog"
                            className="inline-flex items-center px-5 py-3 text-sm font-semibold rounded-full shadow-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-xl transition"
                        >
                            Create New Post
                        </Link>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                    {blogs.map((blog) => (
                        <div key={blog._id} className="group flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white/80 backdrop-blur border border-emerald-50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                            {blog.imageUrl && (
                                <div className="flex-shrink-0 h-48 w-full bg-gray-200 overflow-hidden">
                                    {blog.imageUrl.match(/\.(mp4|mov|webm)$/i) ? (
                                        <video className="h-full w-full object-cover" controls>
                                            <source src={blog.imageUrl} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <img className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" src={blog.imageUrl} alt={blog.title} />
                                    )}
                                </div>
                            )}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 text-xs font-medium text-emerald-700 mb-3">
                                        {blog.tags && blog.tags.map((tag, idx) => (
                                            <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                        {!blog.tags?.length && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">General</span>}
                                    </div>
                                    <Link to={`/blog/${blog._id}`} className="block space-y-2">
                                        <p className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition">{blog.title}</p>
                                        <p className="text-sm text-gray-600 line-clamp-3">
                                            {blog.content.substring(0, 170)}...
                                        </p>
                                    </Link>
                                </div>
                                <div className="mt-6 flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="sr-only">{blog.author?.username || 'Admin'}</span>
                                        <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold uppercase">
                                            {blog.author?.username ? blog.author.username[0] : 'A'}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">
                                            {blog.author?.username || 'Unknown Author'}
                                        </p>
                                        <div className="flex space-x-1 text-xs text-gray-500">
                                            <time dateTime={blog.createdAt}>
                                                {new Date(blog.createdAt).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {blogs.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No blog posts found. Check back later!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogList;
