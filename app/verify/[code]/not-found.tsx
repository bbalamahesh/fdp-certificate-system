export default function NotFound() {
    return (
        <div className="h-screen flex items-center justify-center">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Certificate Not Found</h1>
                <p className="text-muted-foreground">
                    The certificate ID you entered is invalid or does not exist.
                </p>
            </div>
        </div>
    )
}