interface ErrorMessageProps {
  title: string
  error: Error
}

export function ErrorMessage({ title, error }: ErrorMessageProps) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
      <p className="font-medium text-destructive">{title}</p>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  )
}
