import React from "react";

const testimonials = [
  {
    id: 1,
    name: "John Doe",
    role: "Marketing Director, TechCorp",
    image:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100",
    rating: 4,
    text: "ContentAI has revolutionized our content workflow. The quality of the articles is outstanding, and it saves us hours of work every week.",
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Content Creator, TechCorp",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100",
    rating: 5,
    text: "ContentAI has made our content creation process effortless. The AI tools have helped us produce high-quality content faster than ever before.",
  },
  {
    id: 3,
    name: "David Lee",
    role: "Content Writer, TechCorp",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop",
    rating: 4,
    text: "ContentAI has transformed our content creation process. The AI tools have helped us produce high-quality content faster than ever before.",
  },
];

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${
            index < rating ? "text-[#9234EA]" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M10.525.464a.5.5 0 0 1 .95 0l2.107 6.482a.5.5 0 0 0 .475.346h6.817a.5.5 0 0 1 .294.904l-5.515 4.007a.5.5 0 0 0-.181.559l2.106 6.483a.5.5 0 0 1-.77.559l-5.514-4.007a.5.5 0 0 0-.588 0l-5.514 4.007a.5.5 0 0 1-.77-.56l2.106-6.482a.5.5 0 0 0-.181-.56L.832 8.197a.5.5 0 0 1 .294-.904h6.817a.5.5 0 0 0 .475-.346z" />
        </svg>
      ))}
    </div>
  );
};

const Testimonial = () => {
  return (
    <div className="px-4 sm:px-20 xl:px-32 py-20 bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
          Loved by Creators
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Don't just take our word for it. Here's what our users are saying.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="p-8">
              <StarRating rating={testimonial.rating} />

              <p className="text-gray-600 mt-6 mb-8 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  className="w-12 h-12 rounded-full object-cover"
                  src={testimonial.image}
                  alt={testimonial.name}
                />
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonial;
