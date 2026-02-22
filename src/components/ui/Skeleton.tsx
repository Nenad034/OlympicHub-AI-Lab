import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Skeleton loader for content placeholders
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    className,
    style,
}) => (
    <motion.div
        className={className}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        style={{
            width,
            height,
            borderRadius,
            background: 'var(--bg-card)',
            ...style,
        }}
    />
);

/**
 * Card skeleton for module cards
 */
export const CardSkeleton: React.FC = () => (
    <div
        className="module-card"
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '24px',
        }}
    >
        <Skeleton width={50} height={50} borderRadius={12} />
        <Skeleton width="70%" height={24} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="60%" height={16} />
        <div style={{ marginTop: 'auto' }}>
            <Skeleton width="40%" height={32} borderRadius={8} />
        </div>
    </div>
);

/**
 * Table row skeleton
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
    <tr>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} style={{ padding: '16px' }}>
                <Skeleton height={20} />
            </td>
        ))}
    </tr>
);

/**
 * Profile skeleton
 */
export const ProfileSkeleton: React.FC = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width={40} height={40} borderRadius="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Skeleton width={100} height={16} />
            <Skeleton width={60} height={12} />
        </div>
    </div>
);

/**
 * Dashboard grid skeleton
 */
export const DashboardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
    <div className="dashboard-grid">
        {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
        ))}
    </div>
);

/**
 * List skeleton
 */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: rows }).map((_, i) => (
            <div
                key={i}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                }}
            >
                <Skeleton width={40} height={40} borderRadius={10} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Skeleton width="30%" height={18} />
                    <Skeleton width="60%" height={14} />
                </div>
                <Skeleton width={80} height={32} borderRadius={8} />
            </div>
        ))}
    </div>
);

/**
 * Text skeleton for paragraphs
 */
export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === lines - 1 ? '60%' : '100%'}
                height={16}
            />
        ))}
    </div>
);

export default Skeleton;
