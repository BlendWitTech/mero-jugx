import { LockScreen as SharedLockScreen } from '@shared';
import api from '@frontend/services/api';
import { setAppSession } from '@frontend/services/appSessionService';
import { useTheme } from '@frontend/contexts/ThemeContext';

interface LockScreenProps {
    onSuccess: (token: string) => void;
    appName: string;
    hasMfa: boolean;
    userEmail: string;
    appId?: number;
    organizationName?: string;
}

export default function LockScreen(props: LockScreenProps) {
    const { theme } = useTheme();

    return (
        <SharedLockScreen
            {...props}
            api={api}
            setAppSession={setAppSession}
            theme={theme}
        />
    );
}
