import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DataErrorState({ title = "Database connection interrupted" }: { title?: string }) {
  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Card className="border-amber-200 bg-amber-50/70">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-amber-950">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Neon/Postgres was not reachable for a moment. Wait a few seconds, then refresh this page.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="bg-white">
            <Link href="">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
