import type { Metadata } from "next";
import CommunityClient from "./CommunityClient";

export const metadata: Metadata = {
  title: "Communauté ESSOR — Histoires et soutien anonyme",
  description: "Histoires guidées, signes de soutien et présence anonyme. La communauté ESSOR reste gratuite.",
};

export default function CommunautePage() {
  return <CommunityClient />;
}
