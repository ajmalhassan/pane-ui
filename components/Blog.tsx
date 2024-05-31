const Blog = ({ posts }: { posts: any[] }) => {
  return (
    <>
      {posts.map((post, index) => {
        return (
          <div className="mb-8" key={post.id}>
            <a href={post.url} target="_blank" className="hover:underline">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {post.title}
              </h3>
            </a>
            <time className="text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
              {post.readable_publish_date}
            </time>
            <p className="text-base font-normal text-gray-500 dark:text-gray-400 mt-2">
              {post.description}
            </p>
          </div>
        );
      })}
    </>
  );
};

export default Blog;
