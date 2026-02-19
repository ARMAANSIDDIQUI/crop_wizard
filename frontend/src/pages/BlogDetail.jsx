import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const BlogDetail = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await axios.get(`/api/blogs/${id}`);
                setBlog(response.data);
            } catch (err) {
                setError('Failed to fetch blog.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [id]);

    if (loading) return <div className="text-center mt-10">Loading blog...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    if (!blog) return <div className="text-center mt-10">Blog not found.</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
                {blog.imageUrl && (
                    blog.imageUrl.match(/\.(mp4|mov|webm)$/i) ? (
                        <video className="w-full max-h-[500px] object-contain bg-black" controls>
                            <source src={blog.imageUrl} />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <img className="w-full max-h-[500px] object-cover object-center" src={blog.imageUrl} alt={blog.title} />
                    )
                )}
                
                <div className="p-8 md:p-12">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-emerald-600 text-sm font-semibold tracking-wide uppercase">
                            {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        {blog.tags && blog.tags.map((tag, idx) => (
                            <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium ml-2">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    <div className="flex items-center mb-8 pb-8 border-b border-gray-200">
                        <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xl font-bold uppercase mr-4">
                            {blog.author?.username ? blog.author.username[0] : 'A'}
                        </div>
                        <div>
                            <p className="text-gray-900 font-medium text-lg">
                                {blog.author?.username || 'Unknown Author'}
                            </p>
                            <p className="text-gray-500 text-sm">Author</p>
                        </div>
                    </div>

                    <div className="prose prose-lg prose-emerald max-w-none text-gray-700">
                        {/* Render content with line breaks */}
                        {blog.content.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4 leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                        <Link to="/blog" className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center justify-center">
                            ← Back to all posts
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;