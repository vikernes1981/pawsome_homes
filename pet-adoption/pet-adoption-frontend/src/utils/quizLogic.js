// utils/quizLogic.js

export function calculateBestPets(answers) {
  const petScores = {
    Dog: 0,
    Cat: 0,
    Fish: 0,
    Rabbit: 0,
    Bird: 0,
    Hamster: 0,
    Reptile: 0,
    Turtle: 0,
    Ferret: 0,
    GuineaPig: 0,
  };

  const {
    activityHours,
    activityLevel,
    allergies,
    homeSpace,
    budget,
    children,
    timeAway,
    travelFrequency,
    groomingPreference,
    petSize,
    lifespan,
    social,
  } = answers;

  if (activityHours === "4") petScores.Dog += 2;
  if (activityHours === "2") {
    petScores.Cat += 1;
    petScores.Rabbit += 1;
    petScores.Dog += 1;
  }
  if (activityHours === "1") {
    petScores.Fish += 1;
    petScores.Hamster += 1;
  }

  if (activityLevel === "High") petScores.Dog += 2;
  if (activityLevel === "Low") petScores.Fish += 2;

  if (allergies === "Yes") {
    petScores.Fish += 2;
    petScores.Reptile += 2;
  }

  if (homeSpace === "Small") {
    petScores.Cat += 1;
    petScores.Fish += 1;
    petScores.Hamster += 1;
  }
  if (homeSpace === "Large") {
    petScores.Dog += 2;
    petScores.Rabbit += 1;
  }

  if (budget === "Low") {
    petScores.Fish += 2;
    petScores.Hamster += 2;
  }

  if (children === "Yes") {
    petScores.Dog += 2;
    petScores.Rabbit += 1;
    petScores.GuineaPig += 1;
  }

  if (timeAway === "Often") {
    petScores.Fish += 1;
    petScores.Reptile += 1;
    petScores.Cat += 1;
  }

  if (travelFrequency === "Frequent") {
    petScores.Fish += 1;
    petScores.Reptile += 1;
  }

  if (groomingPreference === "Low") {
    petScores.Fish += 1;
    petScores.Reptile += 1;
  }

  if (petSize === "Small") {
    petScores.Cat += 1;
    petScores.Bird += 1;
    petScores.Hamster += 1;
  }

  if (lifespan === "Long") {
    petScores.Turtle += 2;
    petScores.Dog += 1;
  }

  if (social === "High") {
    petScores.Dog += 2;
    petScores.Parrot += 1;
  }

  const primaryPet = Object.keys(petScores).reduce((a, b) =>
    petScores[a] > petScores[b] ? a : b
  );

  delete petScores[primaryPet];
  const secondaryPet = Object.keys(petScores).reduce((a, b) =>
    petScores[a] > petScores[b] ? a : b
  );

  return { primaryPet, secondaryPet };
}
