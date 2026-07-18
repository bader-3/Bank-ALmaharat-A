import { CoursesDiscovery } from "@/components/courses/courses-discovery";
import { getSpecialtyById } from "@/lib/courses/mock-data";

type CoursesPageProps = {
  searchParams: Promise<{ specialty?: string }>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const specialty =
    params.specialty && getSpecialtyById(params.specialty) ? params.specialty : undefined;

  return <CoursesDiscovery initialSpecialtyId={specialty} />;
}
