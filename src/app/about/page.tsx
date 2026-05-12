
import AboutClient from "./AboutClient";
import { getPageContentApi } from "@/lib/api/pageContent";

export const metadata = {
  title: "About Us | Athletic Force 1",
  description: "Learn about the mission, vision, and journey of Athletic Force 1 - the elite choice for high-performance team uniforms and gear.",
};

export default async function AboutPage() {
  const res = await getPageContentApi("about");
  const initialData = res.ok ? res.data : null;
  
  return <AboutClient initialData={initialData} />;
}
