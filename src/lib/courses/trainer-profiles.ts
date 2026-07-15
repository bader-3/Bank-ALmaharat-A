import { COURSES, getTrainerById } from "@/lib/courses/mock-data";
import type { Course } from "@/types/course";
import type { TrainerRatingSummary, TrainerReview } from "@/types/trainer";

const REVIEW_AUTHORS = [
  "سارة العتيبي",
  "محمد الغامدي",
  "نوف الحربي",
  "عبدالله الشهري",
  "ريم الدوسري",
  "فيصل القحطاني",
  "هيفاء الزهراني",
  "بندر المطيري",
];

const REVIEW_TEMPLATES = [
  {
    rating: 5,
    text: "أسلوب شرح واضح ومباشر — استفدت من أول درس وقررت إكمال المسار.",
  },
  {
    rating: 5,
    text: "يتعامل مع الأسئلة بصبر ويربط المفاهيم بأمثلة من الواقع.",
  },
  {
    rating: 4,
    text: "محتوى قوي ومنظم. بعض الدروس تحتاج مراجعة ثانية لكن النتيجة تستحق.",
  },
  {
    rating: 4,
    text: "مناسب للاستكشاف بساعات قليلة قبل الالتزام بإكمال الدورة.",
  },
  {
    rating: 5,
    text: "بعد تجربة مدربين مختلفين، عدت لهذا المدرب — أسلوبه يناسبني.",
  },
  {
    rating: 4,
    text: "التمارين العملية ممتازة. أتمنى المزيد من الأمثلة التطبيقية.",
  },
  {
    rating: 5,
    text: "ساعدني على فهم موضوع كان صعبًا عليّ من قبل — شكرًا.",
  },
  {
    rating: 3,
    text: "جيد للمبتدئين. المتقدّم قد يحتاج محتوى أعمق في بعض الدروس.",
  },
] as const;

function trainerSeed(id: string): number {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getCoursesByTrainerId(trainerId: string): Course[] {
  return COURSES.filter((course) => course.trainerId === trainerId);
}

export function getTrainerReviews(trainerId: string): TrainerReview[] {
  const trainer = getTrainerById(trainerId);
  const courses = getCoursesByTrainerId(trainerId);
  if (!trainer || courses.length === 0) return [];

  const seed = trainerSeed(trainerId);
  const reviewCount = Math.min(5, Math.max(3, courses.length + 1));

  return Array.from({ length: reviewCount }, (_, index) => {
    const template = REVIEW_TEMPLATES[(seed + index) % REVIEW_TEMPLATES.length];
    const course = courses[index % courses.length];
    const daysAgo = 12 + ((seed + index * 7) % 180);

    return {
      id: `${trainerId}-review-${index + 1}`,
      trainerId,
      authorName: REVIEW_AUTHORS[(seed + index) % REVIEW_AUTHORS.length],
      rating: template.rating,
      courseSlug: course.slug,
      courseTitle: course.title,
      text: template.text,
      createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    };
  });
}

export function getTrainerRatingSummary(trainerId: string): TrainerRatingSummary {
  const reviews = getTrainerReviews(trainerId);
  const breakdown: TrainerRatingSummary["breakdown"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (!reviews.length) {
    return { average: 0, count: 0, breakdown };
  }

  let total = 0;
  reviews.forEach((review) => {
    const star = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] += 1;
    total += review.rating;
  });

  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    breakdown,
  };
}
