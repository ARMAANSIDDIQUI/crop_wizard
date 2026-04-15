import React, { useState, useEffect } from 'react';
import { backendApi } from '../utils/api';
import { useParams, Link } from 'react-router-dom';

const BlogDetail = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await backendApi.get(`/blogs/${id}`);
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
        <div className="relative bg-beige-50 min-h-screen overflow-hidden">
            <div className="absolute top-0 -left-28 w-80 h-80 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
            <div className="absolute top-8 -right-28 w-96 h-96 bg-lime-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

            <div className="relative max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 backdrop-blur shadow-2xl rounded-3xl overflow-hidden border border-emerald-50">
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
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <span className="text-emerald-700 text-sm font-semibold tracking-wide uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                {new Date(blog.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {blog.tags && blog.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-emerald-900 mb-6 leading-tight">
                            {blog.title}
                        </h1>

                        <div className="flex items-center mb-8 pb-8 border-b border-gray-100">
                            <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-xl font-bold uppercase mr-4">
                                {blog.author?.username ? blog.author.username[0] : 'A'}
                            </div>
                            <div>
                                <p className="text-gray-900 font-semibold text-lg">
                                    {blog.author?.username || 'Unknown Author'}
                                </p>
                                <p className="text-gray-500 text-sm">Author</p>
                            </div>
                        </div>

                        <div className="prose prose-lg prose-emerald max-w-none text-gray-700">
                            {blog.content.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4 leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                            <Link to="/blog" className="text-emerald-600 hover:text-emerald-800 font-semibold flex items-center justify-center">
                                ← Back to all posts
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
