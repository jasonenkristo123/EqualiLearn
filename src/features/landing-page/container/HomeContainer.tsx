import HomeAccessibility from "../components/HomeAccessibility";
import HomeFeatures from "../components/HomeFeatures";
import HomeHero from "../components/HomeHero";
import HomeHowItWorks from "../components/HomeHowItWorks";

export default function HomeContainer() {
  return (
    <>
      <HomeHero />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeAccessibility />
    </>
  );
}
