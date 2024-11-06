import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="max-w-5xl mx-auto p-16 bg-gray-200 shadow-lg rounded-lg mt-20">
      <h1 className="text-4xl font-bold text-center text-green-700 mb-8">About Pet Adoption</h1>

      {/* Section 1: Introduction */}
      <section className="mb-6">
        <p className="text-lg text-gray-700 leading-relaxed">
          Pet adoption is not just about finding pets a home; it's about creating new beginnings for pets and bringing joy to families. At our Pet Adoption Platform, we are committed to connecting potential adopters with pets in need of loving homes. By adopting a pet, you’re making a difference in their life and contributing to a humane and caring society.
        </p>
      </section>

      {/* Section 2: Mission */}
      <section className="mb-6">
        <h2 className="text-3xl font-semibold text-green-600 mb-4">Our Mission</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Our mission is to bridge the gap between shelters and those looking to adopt, ensuring every pet gets a second chance at life. We believe that every pet deserves a loving family, and we work tirelessly to make the adoption process as smooth and transparent as possible.
        </p>
      </section>

      {/* Section 3: Why Choose Pet Adoption? */}
      <section className="mb-6">
        <h2 className="text-3xl font-semibold text-green-600 mb-4">Why Choose Pet Adoption?</h2>
        <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed">
          <li>Adopting saves lives: When you adopt, you save two lives – the pet you bring home and the one that takes its place at the shelter.</li>
          <li>Supporting shelters: Adoption helps reduce the strain on overcrowded shelters.</li>
          <li>Healthy pets: Shelters often provide vaccinations, spaying/neutering, and health checkups for the pets in their care.</li>
        </ul>
      </section>

      {/* Section 4: Our Values */}
      <section className="mb-6">
        <h2 className="text-3xl font-semibold text-green-600 mb-4">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Value 1 */}
          <div className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-green-700 mb-2">Compassion</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              We are driven by compassion for animals and a desire to improve their lives by finding them loving homes.
            </p>
          </div>
          {/* Value 2 */}
          <div className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-green-700 mb-2">Transparency</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our platform ensures transparency in the adoption process, making sure adopters and shelters have all the necessary information.
            </p>
          </div>
          {/* Value 3 */}
          <div className="p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-green-700 mb-2">Community</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              We believe in building a community that values the welfare of animals and supports the adoption movement.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Call to Action */}
      <section className="text-center mt-6">
        <h2 className="text-3xl font-semibold text-green-600 mb-6">Start Your Adoption Journey Today!</h2>
        <Link to="/">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition">
            Browse Available Pets
          </button>
        </Link>
      </section>
    </div>
  );
};

export default AboutUs;
