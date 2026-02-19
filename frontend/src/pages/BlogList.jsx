import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BlogList = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

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

        // Check if user is admin
        const role = localStorage.getItem('role');
        if (role === 'admin') {
            setIsAdmin(true);
        }
    }, []);

    if (loading) return <div className="text-center mt-10">Loading blogs...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Crop Insights & News</h1>
                    {isAdmin && (
                        <Link
                            to="/admin/blog"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                            Create New Post
                        </Link>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
                    {blogs.map((blog) => (
                        <div key={blog._id} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
                            {blog.imageUrl && (
                                <div className="flex-shrink-0 h-48 w-full bg-gray-200">
                                    {blog.imageUrl.match(/\.(mp4|mov|webm)$/i) ? (
                                        <video className="h-full w-full object-cover" controls>
                                            <source src={blog.imageUrl} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <img className="h-full w-full object-cover" src={blog.imageUrl} alt={blog.title} />
                                    )}
                                </div>
                            )}
                            <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-emerald-600 mb-2">
                                        {blog.tags && blog.tags.map((tag, idx) => (
                                            <span key={idx} className="mr-2 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <Link to={`/blog/${blog._id}`} className="block mt-2">
                                        <p className="text-xl font-semibold text-gray-900">{blog.title}</p>
                                        <p className="mt-3 text-base text-gray-500 line-clamp-3">
                                            {blog.content.substring(0, 150)}...
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
                                        <div className="flex space-x-1 text-sm text-gray-500">
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