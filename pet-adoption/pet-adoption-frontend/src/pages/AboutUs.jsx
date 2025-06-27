import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({
    adoptions: 0,
    shelters: 0,
    happyFamilies: 0
  });

  // Smooth scroll-in animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animated counters
  useEffect(() => {
    const animateCounters = () => {
      const targets = { adoptions: 1247, shelters: 85, happyFamilies: 1156 };
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = duration / steps;

      let currentCounts = { adoptions: 0, shelters: 0, happyFamilies: 0 };

      const timer = setInterval(() => {
        let allComplete = true;

        Object.keys(targets).forEach(key => {
          if (currentCounts[key] < targets[key]) {
            currentCounts[key] += Math.ceil(targets[key] / steps);
            if (currentCounts[key] > targets[key]) {
              currentCounts[key] = targets[key];
            }
            allComplete = false;
          }
        });

        setCounters({ ...currentCounts });

        if (allComplete) {
          clearInterval(timer);
        }
      }, increment);

      return () => clearInterval(timer);
    };

    const timeoutId = setTimeout(animateCounters, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const values = [
    {
      icon: "❤️",
      title: "Compassion",
      description: "We are driven by compassion for animals and a desire to improve their lives by finding them loving homes."
    },
    {
      icon: "🛡️",
      title: "Transparency", 
      description: "Our platform ensures transparency in the adoption process, making sure adopters and shelters have all the necessary information."
    },
    {
      icon: "👥",
      title: "Community",
      description: "We believe in building a community that values the welfare of animals and supports the adoption movement."
    }
  ];

  const stats = [
    {
      icon: "🐾",
      number: counters.adoptions,
      label: "Successful Adoptions",
      suffix: "+"
    },
    {
      icon: "🤝",
      number: counters.shelters,
      label: "Partner Shelters",
      suffix: ""
    },
    {
      icon: "🏆",
      number: counters.happyFamilies,
      label: "Happy Families",
      suffix: "+"
    }
  ];

  const benefits = [
    {
      title: "Save Lives",
      description: "When you adopt, you save two lives – the pet you bring home and the one that takes its place at the shelter.",
      icon: "💝"
    },
    {
      title: "Support Shelters", 
      description: "Adoption helps reduce the strain on overcrowded shelters and supports their vital work.",
      icon: "🏠"
    },
    {
      title: "Healthy Pets",
      description: "Shelters often provide vaccinations, spaying/neutering, and comprehensive health checkups.",
      icon: "🏥"
    },
    {
      title: "Unconditional Love",
      description: "Rescue pets often show extra gratitude and form deep bonds with their adoptive families.",
      icon: "❤️"
    },
    {
      title: "Cost Effective",
      description: "Adoption fees are typically much lower than purchasing from breeders or pet stores.",
      icon: "💰"
    },
    {
      title: "Fighting Puppy Mills",
      description: "Choosing adoption over purchase helps reduce demand for puppy mills and unethical breeding.",
      icon: "⚖️"
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-green-700 text-white py-20 mt-16">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            About <span className="text-green-200">Pawsome Homes</span>
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto opacity-90">
            Connecting hearts, saving lives, and building families one adoption at a time
          </p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-8 bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {stat.number.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-lg text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        
        {/* Mission Section */}
        <section className="mb-20 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-8">Our Mission</h2>
          <div className="bg-white p-10 rounded-2xl shadow-xl border-l-4 border-green-600">
            <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
              Our mission is to bridge the gap between shelters and those looking to adopt, ensuring every pet gets a second chance at life. We believe that every pet deserves a loving family, and we work tirelessly to make the adoption process as smooth, transparent, and joyful as possible.
            </p>
          </div>
        </section>

        {/* Why Choose Adoption Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Why Choose Pet Adoption?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="text-5xl mb-4 text-center">{benefit.icon}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed text-center">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {values.map((value, index) => (
              <div key={index} className="text-center bg-white p-10 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">How Pawsome Homes Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Browse Pets", description: "Explore our comprehensive database of adoptable pets from verified shelters.", icon: "🔍" },
              { step: "2", title: "Find Your Match", description: "Use our quiz and filters to find pets that match your lifestyle and preferences.", icon: "💕" },
              { step: "3", title: "Connect", description: "Submit adoption requests and communicate directly with shelter administrators.", icon: "🤝" },
              { step: "4", title: "Welcome Home", description: "Complete the adoption process and welcome your new family member!", icon: "🏠" }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team/About Section */}
        <section className="mb-20 bg-gradient-to-r from-green-50 to-blue-50 p-12 rounded-2xl">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">About Our Platform</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Pawsome Homes was created with love and dedication to revolutionize the pet adoption experience. Our platform combines cutting-edge technology with genuine care for animal welfare.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We work exclusively with verified shelters and rescue organizations to ensure every pet on our platform receives the care and attention they deserve while waiting for their forever home.
              </p>
              <div className="flex flex-wrap gap-4">
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">✅ Verified Shelters</span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">🔒 Secure Platform</span>
                <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">⏰ 24/7 Support</span>
                <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">🤝 Community Driven</span>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Impact</h3>
                <p className="text-gray-600 mb-6">Together, we're making a difference in the lives of pets and families across the country.</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">4.9</div>
                    <div className="text-sm text-gray-600">User Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center bg-gradient-to-r from-green-600 to-green-700 text-white p-12 rounded-2xl shadow-2xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Change a Life?</h2>
          <p className="text-xl leading-relaxed mb-8 max-w-3xl mx-auto opacity-90">
            Start your adoption journey today and discover the joy of giving a deserving pet their forever home. Every adoption creates a ripple of positive change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pet-list">
              <button className="px-8 py-4 bg-white text-green-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Browse Available Pets
              </button>
            </Link>
            <Link to="/quiz">
              <button className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-400 transform hover:-translate-y-1 transition-all duration-300">
                Take Compatibility Quiz
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;