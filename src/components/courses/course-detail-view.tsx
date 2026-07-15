import { CoursePurchaseActions } from "@/components/courses/course-purchase-actions";
import { CourseWalletHint } from "@/components/courses/course-wallet-hint";
import { FavoriteButton } from "@/components/courses/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconArrow } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import { getSpecialtyById, getTrainerById } from "@/lib/courses/mock-data";
import {
  formatLessonHours,
  getFirstLesson,
  getLessonHours,
  getLessonsForCourse,
} from "@/lib/learning/lessons";
import { DELIVERY_LABELS, LEVEL_LABELS, type Course } from "@/types/course";
import Link from "next/link";

interface CourseDetailViewProps {
  course: Course;
}

export function CourseDetailView({ course }: CourseDetailViewProps) {
  const specialty = getSpecialtyById(course.specialtyId);
  const trainer = getTrainerById(course.trainerId);
  const lessons = getLessonsForCourse(course);
  const firstLesson = getFirstLesson(course);
  const firstLessonHours = firstLesson ? getLessonHours(firstLesson) : course.hours;

  return (
    <Container className="py-12 lg:py-16">
      <Link
        href={ROUTES.courses}
        className="inline-flex items-center gap-1 text-sm text-foreground-secondary transition-colors hover:text-foreground"
      >
        <IconArrow className="rotate-180" />
        العودة للدورات
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {specialty && <Badge variant="sage">{specialty.name}</Badge>}
              <Badge variant="neutral">{LEVEL_LABELS[course.level]}</Badge>
              <Badge variant="neutral">{DELIVERY_LABELS[course.deliveryMode]}</Badge>
              {course.hasCertificate && <Badge variant="gold">شهادة</Badge>}
            </div>
            <FavoriteButton courseSlug={course.slug} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-balance text-navy-900">{course.title}</h1>
          <p className="mt-4 text-pretty text-lg text-foreground-secondary">{course.summary}</p>

          <div className="mt-8 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-navy-900">عن الدورة</h2>
              <p className="mt-3 text-foreground-secondary">{course.description}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900">ما ستتعلّمه</h2>
              <ul className="mt-3 space-y-2">
                {course.goals.map((goal) => (
                  <li key={goal} className="flex items-start gap-2.5 text-foreground-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
                    {goal}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900">المتطلبات</h2>
              <ul className="mt-3 space-y-2">
                {course.prerequisites.map((item) => (
                  <li key={item} className="text-foreground-secondary">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900">دروس الدورة</h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                تشتري كل درس على حدة — تُخصم ساعات الدرس من محفظتك. إكمال جميع الدروس
                شرط للحصول على الشهادة.
              </p>
              <div className="mt-4 space-y-4">
                {course.syllabus.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <p className="text-sm font-semibold text-navy-800">
                      {moduleIndex + 1}. {module.title}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-navy-900">{lesson.title}</p>
                            <p className="mt-0.5 text-xs text-foreground-muted">
                              الدرس {lessonIndex + 1} من {lessons.length}
                            </p>
                          </div>
                          <Badge variant={lessonIndex === 0 ? "gold" : "neutral"}>
                            {formatLessonHours(lesson)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card padding="lg" className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-foreground-muted">المدرب</p>
              {trainer && (
                <>
                  <Link
                    href={ROUTES.trainer(trainer.id)}
                    className="mt-1 inline-block text-base font-semibold text-sage-700 transition-colors hover:text-sage-800 hover:underline"
                  >
                    {trainer.name}
                  </Link>
                  <p className="mt-1 text-sm text-foreground-secondary">{trainer.title}</p>
                  <p className="mt-3 text-sm text-foreground-secondary">{trainer.bio}</p>
                  <Button href={ROUTES.trainer(trainer.id)} variant="ghost" size="sm" className="mt-3 px-0">
                    عرض ملف المدرب
                  </Button>
                </>
              )}
            </div>

            <div className="section-rule" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">إجمالي الدورة</span>
              <span className="text-base font-semibold text-navy-900">
                {formatHoursAndMinutes(course.hours, true)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">الدرس الأول</span>
              <span className="text-base font-semibold text-gold-600">
                {formatHoursAndMinutes(firstLessonHours, true)}
              </span>
            </div>

            <CourseWalletHint course={course} requiredHours={firstLessonHours} />

            <CoursePurchaseActions course={course} firstLessonHours={firstLessonHours} />

            <p className="text-center text-xs text-foreground-muted">
              تُخصم ساعات كل درس عند شرائه.
              {course.hasCertificate
                ? " الشهادة تُمنح بعد إتمام جميع متطلبات الدورة — الاستكشاف لا يكفي."
                : " الاستكشاف لا يعادل إكمال الدورة."}
            </p>

            <Button href={ROUTES.courses} variant="secondary" fullWidth>
              استكشف دورات أخرى
            </Button>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
