"use client";

interface ClickableImageProps {
    src: string;
    alt: string;
    className: string;
    href?: string;
}

export default function ClickableImage({ src, alt, className, href }: ClickableImageProps) {
    const handleClick = () => {
        if (href) {
            window.open(href, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onClick={handleClick}
        />
    );
}



