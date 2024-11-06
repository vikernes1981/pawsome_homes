const getAdoptionAnswer = () => {
    const answers = [
        "The adoption process typically involves filling out an application, meeting the pet, and possibly a home visit.",
        "To adopt a pet, you usually need to apply online, meet the animal in person, and complete the necessary paperwork.",
        "The steps for adopting a pet generally include submitting an application, having an interview, and signing an adoption agreement.",
        "First, you'll need to fill out an adoption application. Then you might have an interview to discuss your home and lifestyle.",
        "After applying to adopt, you will be contacted to arrange a meeting with the pet you’re interested in.",
        "The process often starts with an application, followed by a meet-and-greet with the pet, and finally signing the adoption contract.",
        "To start the adoption process, please fill out our online form, and we will get in touch with you soon.",
        "You will need to provide some information about your living situation and family to ensure the best match for your new pet.",
        "Adoption fees often help cover the costs of vaccinations and spaying/neutering your new pet.",
        "We encourage potential adopters to consider their lifestyle and the time they can dedicate to a pet.",
        "Our adoption team will guide you through the entire process to make it as smooth as possible.",
        "It's important to ask questions about the pet’s background and behavior during your meeting.",
        "Every pet adopted comes with a health check and some essential supplies to get you started.",
        "You can find a list of available pets on our website, updated regularly.",
        "Adoption events are held monthly, where you can meet multiple pets in one visit.",
        "We have a 30-day trial period to ensure the pet is a good fit for your home.",
        "It's crucial to prepare your home before bringing a new pet to ensure their comfort and safety.",
        "Adoption applications can be completed online, and we encourage early submissions for popular pets.",
        "Feel free to bring family members to meet the pet during the adoption process.",
        "The adoption process may vary slightly depending on the type of pet you're interested in.",
        "You can also follow up with our team after your adoption to discuss any questions or concerns."
    ];

    // Select a random answer
    return answers[Math.floor(Math.random() * answers.length)];
};

export { getAdoptionAnswer };
