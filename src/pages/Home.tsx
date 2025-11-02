import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const properties = [
  {
    id: 1,
    title: "Maitama Smart Luxury Villa",
    location: "Maitama, Abuja",
    price: "$1,200,000",
    image: "/src/assets/hero/maitama_tower.jpg",
    features: ["6 Bedrooms", "AI Energy Control", "Infinity Pool", "Smart Security"],
  },
  {
    id: 2,
    title: "Gwarinpa AI-Enabled Estate",
    location: "Gwarinpa, Abuja",
    price: "$850,000",
    image: "/src/assets/hero/gwarinpa_estate.jpg",
    features: ["4 Bedrooms", "Solar Smart Roof", "Voice-Control Lighting", "24/7 Surveillance"],
  },
  {
    id: 3,
    title: "Asokoro Skyline Penthouse",
    location: "Asokoro, Abuja",
    price: "$1,500,000",
    image: "/src/assets/hero/abuja_villa.jpg",
    features: ["7 Bedrooms", "Panoramic View", "Smart Glass Walls", "Automated Concierge"],
  },
];

const Home = () => {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-20 px-6">
          <motion.div
            className="md:w-1/2 space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl font-extrabold leading-tight">
              Discover Futuristic Homes in <span className="text-accent">Abuja</span>
            </h1>
            <p className="text-lg text-gray-100">
              Experience AI-driven real estate that adapts to your lifestyle.
              From smart villas to voice-controlled estates, your dream home awaits.
            </p>
            <Link
              to="/listings"
              className="bg-accent text-dark font-semibold px-6 py-3 rounded-full shadow hover:bg-yellow-400 transition"
            >
              Explore Properties
            </Link>
          </motion.div>

          <motion.div
            className="md:w-1/2 mt-10 md:mt-0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="/src/assets/hero/abuja_villa.jpg"
              alt="Abuja Smart Villa"
              className="rounded-2xl shadow-lg"
            />
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-light">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-dark mb-10 text-center">
            Featured Smart Properties in Abuja
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {properties.map((property) => (
              <motion.div
                key={property.id}
                className="bg-white shadow-card rounded-2xl overflow-hidden hover:shadow-lg transition"
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-56 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-primary">{property.title}</h3>
                  <p className="text-sm text-gray-600">{property.location}</p>
                  <p className="text-lg font-bold text-secondary mt-2">{property.price}</p>
                  <ul className="mt-3 text-sm text-gray-700 space-y-1">
                    {property.features.map((feat) => (
                      <li key={feat}>• {feat}</li>
                    ))}
                  </ul>
                  <Link
                    to={`/property/${property.id}`}
                    className="block mt-4 text-center bg-primary text-white py-2 rounded-lg hover:bg-secondary"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Chatbot Button */}
      <button
        className="fixed bottom-8 right-8 bg-secondary hover:bg-primary text-white p-4 rounded-full shadow-xl transition"
        title="Chat with AI Realtor"
        onClick={() => alert('AI Realtor Chatbot Coming Soon!')}
      >
        💬
      </button>
    </div>
  );
};

export default Home;
