export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-2">
                <h1 className="text-xl font-semibold">
                    Certificate Not Found ❌
                </h1>
                <p className="text-sm text-muted-foreground">
                    This certificate ID is invalid or does not exist.
                </p>
            </div>
        </div>
    )
}
