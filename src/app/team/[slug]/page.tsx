import { Metadata } from "next";
import TeamStoreClient from "./TeamStoreClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Replace hyphens with spaces and capitalize for basic meta title fallback
  const fallbackTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    title: `${fallbackTitle} | Athletic Force 1 Team Store`,
    description: `Explore the official Athletic Force 1 gear collection for ${fallbackTitle}.`,
  };
}

export default async function TeamStorePage({ params }: Props) {
  const { slug } = await params;
  
  return <TeamStoreClient slug={slug} />;
}
