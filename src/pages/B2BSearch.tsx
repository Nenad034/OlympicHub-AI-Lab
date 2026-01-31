import React from 'react';
import GlobalHubSearch from './GlobalHubSearch';
import { useAuthStore } from '../stores';
import { useNavigate } from 'react-router-dom';

/**
 * B2B Search - Dedicated wrapper for subagent search experience
 * Forces B2B mode regardless of user level for testing/demo purposes
 */
const B2BSearch: React.FC = () => {
    const { userLevel } = useAuthStore();
    const navigate = useNavigate();

    // Redirect staff users to regular hub search
    if (userLevel >= 6) {
        React.useEffect(() => {
            navigate('/hub');
        }, [navigate]);
        return null;
    }

    return (
        <div className="b2b-search-wrapper">
            <GlobalHubSearch />
        </div>
    );
};

export default B2BSearch;
