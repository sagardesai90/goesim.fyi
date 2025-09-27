// Utility for scheduling scraping jobs
// This would typically integrate with a job queue system like Bull or Agenda

export interface ScrapingJob {
  id: string
  provider: string
  country?: string
  scheduledAt: Date
  status: "pending" | "running" | "completed" | "failed"
  priority: number
}

export class ScrapingScheduler {
  private static jobs: Map<string, ScrapingJob> = new Map()

  static scheduleJob(provider: string, country?: string, priority = 1): string {
    const jobId = `${provider}-${country || "all"}-${Date.now()}`
    const job: ScrapingJob = {
      id: jobId,
      provider,
      country,
      scheduledAt: new Date(),
      status: "pending",
      priority,
    }

    this.jobs.set(jobId, job)
    return jobId
  }

  static async executeJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    job.status = "running"

    try {
      // Execute the scraping job
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: job.provider,
          country: job.country,
        }),
      })

      if (response.ok) {
        job.status = "completed"
        return true
      } else {
        job.status = "failed"
        return false
      }
    } catch (error) {
      job.status = "failed"
      return false
    }
  }

  static getJobStatus(jobId: string): ScrapingJob | null {
    return this.jobs.get(jobId) || null
  }

  static getAllJobs(): ScrapingJob[] {
    return Array.from(this.jobs.values())
  }

  static getPendingJobs(): ScrapingJob[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.status === "pending")
      .sort((a, b) => b.priority - a.priority)
  }
}
