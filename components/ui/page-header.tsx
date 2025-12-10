import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
}

export function PageHeader({
    title,
    description,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-1", className)} {...props}>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {title}
            </h1>
            {description && (
                <p className="text-muted-foreground text-sm md:text-base">
                    {description}
                </p>
            )}
        </div>
    )
}
