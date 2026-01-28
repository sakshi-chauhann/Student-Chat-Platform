import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
const EMAIL_DOMAIN = '@gehu.ac.in';
const STORAGE_KEY_USER = 'scp:user';
const STORAGE_KEY_NOTES = 'scp:notes';
const STORAGE_KEY_THEME = 'scp:theme';
const STORAGE_KEY_GROUPS = 'scp:groups';
const STORAGE_KEY_FOLLOWS = 'scp:follows';
const STORAGE_KEY_DMS = 'scp:dms';
const STORAGE_KEY_WARNINGS = 'scp:warnings';
const STORAGE_KEY_BANNED = 'scp:banned';

const DIRECTORY = [
    { id: 'u1', name: 'Aarav Sharma', course: 'B.Tech CSE', semYear: 'Sem 3 2025', email: 'aarav.230123001@gehu.ac.in', alumni: 'No' },
    { id: 'u2', name: 'Sakshi Chauhan', course: 'B.Tech CSE', semYear: 'Sem 5. 2025', email: 'sakshichauhan.230421407@gehu.ac.in', alumni: 'No' },
    { id: 'u3', name: 'Ishita Verma', course: 'BCA', semYear: 'Sem 2 2025', email: 'ishita.230550201@gehu.ac.in', alumni: 'No' },
    { id: 'u4', name: 'Rohan Gupta', course: 'MBA', semYear: 'Batch 2022', email: 'rohan.210998100@gehu.ac.in', alumni: 'Yes' },
    { id: 'u5', name: 'Ananya Joshi', course: 'B.Tech ECE', semYear: 'Batch 2021', email: 'ananya.200761000@gehu.ac.in', alumni: 'Yes' },
    { id: 'u6', name: 'Dev Mehta', course: 'B.Tech CSE', semYear: 'Sem 7 2025', email: 'dev.220111221@gehu.ac.in', alumni: 'No' },
];

const GROUPS = [
    { id: 'g1', name: 'HTML Group', description: 'Web Markup discussion and help', icon: 'ri-html5-fill' },
    { id: 'g2', name: 'Java Group', description: 'Advanced Java Programming', icon: 'ri-java-fill' },
    { id: 'g3', name: 'C++ Group', description: 'C++ Competitive Coding', icon: 'ri-code-s-slash-line' },
    { id: 'g4', name: 'DS Group', description: 'Data Structures and Algorithms', icon: 'ri-node-tree' },
    { id: 'g5', name: 'Engineering Maths', description: 'Maths IV doubt solving', icon: 'ri-function-line' },
];

const RULE_RESPONSES = {
    'hi': 'Hi, how are you?',
    'hello': 'Hi, how are you?',
    'how are you': 'I am fine, what about you?',
    'i am fine': 'Great to hear that!',
    'i am good': 'Great to hear that!',
    'what is java': 'Java is a high-level, **object-oriented programming language** used for applications, web, and Android development.',
    'what is function in java': 'A **function (method) in Java** is a block of reusable code designed to perform a particular task. You can ask me anything specific about them!',
    'what is c++': 'C++ is a powerful language used for **system programming**, game engines, and competitive coding.',
    'what is html': 'HTML is the standard **markup language** for building web pages. It defines the structure of web content.',
    'what is ds': 'DS means **Data Structures** - the way we organize data for efficient access and modification. They are fundamental for algorithms.',
};


const PROFANITY = ['fuck','shit','asshole','bitch','bastard','damn']; 
const THREATS = ['kill you','i will kill','i will beat','i will hurt','i will stab']; 
const SEXUAL = ['xxx','nsfw','nasty']; 
const NON_STUDY_KEYWORDS = ['joke','knock knock','tell me a joke','lmao','hahaha','meme','memes','lol','rofl']; 

const BAN_RULES = [
    
    { 
      regex: /(@[a-z0-9_.]{2,}|instagram|insta|snapchat|snap|facebook|fb|tiktok|discord|https?:\/\/\S+)/i,
      reason: "Sharing contact information, usernames, or external social links is not allowed.",
      action: 'spam' 
    },
    
    { 
      regex: /(\+?\d{1,3}[-\s]?)?(\d{3}[-\s]?\d{3}[-\s]?\d{4})/i,
      reason: "Sharing phone numbers is not allowed.",
      action: 'spam' 
    },


    { 
        regex: /([\uD800-\uDFFF].*?){5,}/, 
        reason: "Excessive or irrelevant emoji use is not allowed.", 
        action: 'warn' 
    },

    ...THREATS.map(phrase => ({
        regex: new RegExp(phrase, 'i'),
        reason: `Threatening or violent language is strictly prohibited. (Phrase: "${phrase}")`,
        action: 'ban'
    })),
    
    ...SEXUAL.map(word => ({
        regex: new RegExp(`\\b${word}\\b`, 'i'),
        reason: `Sexual or inappropriate content is not allowed. (Word: "${word}")`,
        action: 'warn'
    })),


    ...PROFANITY.map(word => ({
        regex: new RegExp(`\\b${word}\\b`, 'i'),
        reason: `Offensive or vulgar language is not allowed. (Word: "${word}")`,
        action: 'warn'
    })),
    
    
    ...NON_STUDY_KEYWORDS.map(word => ({
        regex: new RegExp(word, 'i'),
        reason: `Non-study content (jokes, memes, chit-chat) is not allowed in this chat. (Keyword: "${word}")`,
        action: 'warn'
    })),
];


const getStorage = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        if (key === STORAGE_KEY_BANNED) {
            return value === 'true';
        }
        return JSON.parse(value) || fallback;
    } catch {
        return fallback;
    }
};

const setStorage = (key, value) => {
    if (key === STORAGE_KEY_BANNED) {
        localStorage.setItem(key, value ? 'true' : 'false');
    } else {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

const initialsFromName = (name) => {
    const parts = String(name || "").trim().split(/\s+/);
    return (parts[0]?.[0] || 'U') + (parts[1]?.[0] || "");
};

const titleCase = (name) => String(name || "").replace(/\s+/g, '').trim().split(' ').map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

const findUserByld = (id) => DIRECTORY.find(u => u.id === id);

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};


const useAppState = () => {
    const [currentUser, setCurrentUser] = useState(() => getStorage(STORAGE_KEY_USER, null));
    const [currentView, setCurrentView] = useState('view-chats');
    const [currentTheme, setCurrentTheme] = useState(() =>
        localStorage.getItem(STORAGE_KEY_THEME) || 'light');
    const [appPage, setAppPage] = useState(currentUser ? 'main' : 'login');
    const [notes, setNotes] = useState(() => getStorage(STORAGE_KEY_NOTES, []));
    const [joinedGroups, setJoinedGroups] = useState(() =>
        getStorage(STORAGE_KEY_GROUPS, []));
    const [follows, setFollows] = useState(() => getStorage(STORAGE_KEY_FOLLOWS, []));
    const [dms, setDms] = useState(() => getStorage(STORAGE_KEY_DMS, { dms: {}, groups: {} }));
    const [otherUserProfile, setOtherUserProfile] = useState(null);
    const [activeChat, setActiveChat] = useState({ type: 'dm', id: null });
    const [warningCount, setWarningCount] = useState(() =>
        getStorage(STORAGE_KEY_WARNINGS, 0));
    const [isBanned, setIsBanned] = useState(() => getStorage(STORAGE_KEY_BANNED,
        false));

    useEffect(() => {
        document.body.className = currentTheme === 'dark' ? 'dark-theme' : "";
        localStorage.setItem(STORAGE_KEY_THEME, currentTheme);
    }, [currentTheme]);

    useEffect(() => { setStorage(STORAGE_KEY_WARNINGS, warningCount); },
        [warningCount]);

    useEffect(() => { setStorage(STORAGE_KEY_BANNED, isBanned); }, [isBanned]);
    useEffect(() => { setStorage(STORAGE_KEY_USER, currentUser); }, [currentUser]);
    useEffect(() => { setStorage(STORAGE_KEY_NOTES, notes); }, [notes]);
    useEffect(() => { setStorage(STORAGE_KEY_GROUPS, joinedGroups); },
        [joinedGroups]);
    useEffect(() => { setStorage(STORAGE_KEY_FOLLOWS, follows); }, [follows]);
    useEffect(() => { setStorage(STORAGE_KEY_DMS, dms); }, [dms]);

    const handleLogin = useCallback((user) => {
        let finalUser = DIRECTORY.find(u => u.email.toLowerCase() ===
            user.email.toLowerCase());

        if (finalUser) finalUser = { ...finalUser };
        else {
            finalUser = {
                id: user.id || 'u0',
                name: titleCase(user.name || user.email.split('@')[0]),
                course: user.course || '-',
                semYear: user.semYear || '-',
                alumni: user.alumni || 'No',
                email: user.email
            };
        }

        setCurrentUser(finalUser);
        setAppPage('main');
        setCurrentView('view-chats');
    }, []);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setAppPage('login');
        setCurrentView('view-chats');
    }, []);

    const toggleTheme = useCallback(() => {
        setCurrentTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const changeView = useCallback((viewId) => {
        setCurrentView(viewId);
    }, []);

    const toggleFollow = useCallback((userId) => {
        setFollows(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId);
            return [...prev, userId];
        });
    }, []);

    const addNote = useCallback((file, isGlobal) => {
        const now = new Date();
        const newNote = {
            id: 'n_' + now.getTime() + '_' + Math.random().toString(36).slice(2, 8),
            name: file.name,
            size: file.size,
            uploadedAt: now.toISOString(),
            url: URL.createObjectURL(file),
            ownerId: currentUser?.id || 'u0',
            isGlobal: !!isGlobal
        };

        setNotes(prev => [newNote, ...prev]);
    }, [currentUser]);

    const deleteNote = useCallback((noteId) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
    }, []);

    const toggleGroupMembership = useCallback((groupId) => {
        setJoinedGroups(prev => {
            if (prev.includes(groupId)) return prev.filter(id => id !== groupId);
            return [...prev, groupId];
        });
    }, []);

    const goToGroupChat = useCallback((groupId) => {
        setActiveChat({ type: 'group', id: groupId });
        changeView('view-group-chat');
    }, [changeView]);

    const goToDirectChat = useCallback((userId) => {
        setActiveChat({ type: 'dm', id: userId });
        changeView('view-direct-chat');
    }, [changeView]);

    const createMsgId = () => 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    const clearBanStatus = useCallback(() => {
        setIsBanned(false);
        setWarningCount(0);
        console.log("Ban status cleared for demo.");
    }, []);

    // --- UPDATED sendMessage WITH LOCAL MODERATION RULES ---
    const sendMessage = useCallback((text, currentChatType, currentChatId) => {
        if (!text || !currentChatId || !currentUser) return;

        if (isBanned) {
            console.log("SEND FAILED: User is currently banned.");
            return;
        }

        const senderId = currentUser.id;
        const msg = { id: createMsgId(), text, senderId, timestamp: new Date().toISOString() };

        let localAction = null;
        let violationReason = "";
        
        // Only run moderation on direct messages for this demo feature
        if (currentChatType === 'dm') {
            
            for (const rule of BAN_RULES) {
                if (rule.regex.test(text)) {
                    localAction = rule.action;
                    violationReason = rule.reason;
                    break; 
                }
            }

            if (localAction) {
                
            //
                if (localAction === 'ban') {
                    console.log(`MODERATION: Immediate BAN triggered by rule: ${violationReason}`);
                    
                    const banText = `[PROFILE BANNED] Your profile has been permanently banned due to strictly prohibited content (${violationReason}). Access to sending messages has been revoked.`;
                    setIsBanned(true);
                    setWarningCount(2); 
                    
                    const banMsg = { id: createMsgId(), text: banText, senderId: 'sys_warn', timestamp: new Date().toISOString() };

            
                    setDms(prevDms => {
                        const nextDms = { dms: { ...(prevDms.dms || {}) }, groups: { ...(prevDms.groups || {}) } };
                        const chatKey = [senderId, currentChatId].sort().join('-');
                        nextDms.dms[chatKey] = [...(nextDms.dms[chatKey] || []), banMsg];
                        return nextDms;
                    });
                    return; 
                }

            
                if (localAction === 'spam') {
                    console.log(`MODERATION: SPAM triggered by rule: ${violationReason}`);
                    
                    const spamText = `[SPAM ALERT] Message blocked. Reason: ${violationReason}. This chat is for study purposes only.`;
                    const spamMsg = { id: createMsgId(), text: spamText, senderId: 'sys_spam', timestamp: new Date().toISOString() };

            
                    setDms(prevDms => {
                        const nextDms = { dms: { ...(prevDms.dms || {}) }, groups: { ...(prevDms.groups || {}) } };
                        const chatKey = [senderId, currentChatId].sort().join('-');
                        nextDms.dms[chatKey] = [...(nextDms.dms[chatKey] || []), spamMsg];
                        return nextDms;
                    });
                    return; 
                }
                
                if (localAction === 'warn') {
                    setWarningCount(prevCount => {
                        const newCount = prevCount + 1;
                        console.log(`MODERATION: WARNING triggered. Count: ${newCount}/2. Reason: ${violationReason}`);

                        if (newCount <= 1) {
                            const warningText = `[WARNING 1/2] Message blocked. Reason: ${violationReason}. Repeat this violation once more, and your profile will be BANNED.`;

                            const warningMsg = { id: createMsgId(), text: warningText, senderId: 'sys_warn', timestamp: new Date().toISOString() };

                            setDms(prevDms => {
                                const nextDms = { dms: { ...(prevDms.dms || {}) }, groups: { ...(prevDms.groups || {}) } };
                                const chatKey = [senderId, currentChatId].sort().join('-');
                                nextDms.dms[chatKey] = [...(nextDms.dms[chatKey] || []), warningMsg];
                                return nextDms;
                            });

                        } else {
            
                            const banText = `[PROFILE BANNED] Your profile has been permanently banned (2/2) due to repeated policy violations. Access to sending messages has been revoked.`;
                            setIsBanned(true);
                            
                            const banMsg = { id: createMsgId(), text: banText, senderId: 'sys_warn', timestamp: new Date().toISOString() };

        
                            setDms(prevDms => {
                                const nextDms = { dms: { ...(prevDms.dms || {}) }, groups: { ...(prevDms.groups || {}) } };
                                const chatKey = [senderId, currentChatId].sort().join('-');
                                nextDms.dms[chatKey] = [...(nextDms.dms[chatKey] || []), banMsg];
                                return nextDms;
                            });
                        }

                        return newCount;
                    });

                    return; 
                }
            }
        } 
        setDms(prevDms => {
            const newDms = {
                dms: { ...(prevDms.dms || {}) },
                groups: { ...(prevDms.groups || {}) }
            };

            if (currentChatType === 'dm') {
                const chatKey = [senderId, currentChatId].sort().join('-');
                newDms.dms[chatKey] = [...(newDms.dms[chatKey] || []), msg];
            } else if (currentChatType === 'group') {
                newDms.groups[currentChatId] = [...(newDms.groups[currentChatId] || []), msg];
            }
            return newDms;
        });

        
        if (currentChatType === 'dm') {
            const normalizedText = text.toLowerCase().replace(/[?.,!]/g, "").trim();
            let replyText = RULE_RESPONSES[normalizedText] || '[DEMO REPLY] I received your message! I can answer specific questions about Java, C++, HTML, and Data Structures.';

            if (!RULE_RESPONSES[normalizedText]) {
                for (const key in RULE_RESPONSES) {
                    if (normalizedText.includes(key) && key.length > 5) {
                        replyText = RULE_RESPONSES[key];
                        break;
                    }
                }
            }

            setTimeout(() => {
                const replyMsg = {
                    id: createMsgId(),
                    text: replyText,
                    senderId: currentChatId,
                    timestamp: new Date().toISOString()
                };

                setDms(prevDms2 => {
                    const next = {
                        dms: { ...(prevDms2.dms || {}) },
                        groups: { ...(prevDms2.groups || {}) }
                    };

                    const chatKey = [senderId, currentChatId].sort().join('-');
                    next.dms[chatKey] = [...(next.dms[chatKey] || []), replyMsg];
                    return next;
                }, 600);
            });
        } else if (currentChatType === 'group') {
            setTimeout(() => {
                const replyText = 'Group message sent! (Demo - Real server needed for true group chat)';
                const replyMsg = { id: createMsgId(), text: replyText, senderId: 'demo_bot', timestamp: new Date().toISOString() };

                setDms(prevDms2 => {
                    const next = {
                        dms: { ...(prevDms2.dms || {}) },
                        groups: { ...(prevDms2.groups || {}) }
                    };

                    next.groups[currentChatId] = [...(next.groups[currentChatId] || []), replyMsg];
                    return next;
                });
            }, 600);
        }

    }, [currentUser, isBanned]);

    const deleteMessage = useCallback((chatType, chatId, messageId) => {
        setDms(prev => {
            const next = {
                dms: { ...(prev.dms || {}) },
                groups: { ...(prev.groups || {}) }
            };

            if (chatType === 'dm') {
                const chatKey = Object.keys(next.dms).find(k => k === [currentUser?.id,
                    chatId].sort().join('-') || k === [chatId, currentUser?.id].sort().join('-')) || [currentUser?.id,
                    chatId].sort().join('-');

                next.dms[chatKey] = (next.dms[chatKey] || []).filter(m => m.id !== messageId);
            } else {
                next.groups[chatId] = (next.groups[chatId] || []).filter(m => m.id !== messageId);
            }

            return next;
        });
    }, [currentUser]);

    const deleteChat = useCallback((chatType, chatId) => {
        setDms(prev => {
            const next = {
                dms: { ...(prev.dms || {}) },
                groups: { ...(prev.groups || {}) }
            };

            if (chatType === 'dm') {
                const chatKey = Object.keys(next.dms).find(k => k.includes(chatId) &&
                    k.includes(currentUser?.id));

                if (chatKey) delete next.dms[chatKey];

            } else {
                delete next.groups[chatId];
            }

            return next;
        });
        setActiveChat({ type: 'dm', id: null });
        changeView(chatType === 'dm' ? 'view-chats' : 'view-groups');
    }, [currentUser, changeView]);

    const viewOtherProfile = useCallback((userId) => {
        const user = findUserByld(userId);
        if (user) {
            setOtherUserProfile(user);
            changeView('view-other-profile');
        }
    }, [changeView]);

    const followers = useMemo(() => DIRECTORY.filter(u => u.id === 'u6' && u.id !==
        currentUser?.id).map(u => u.id), [currentUser]);

    const updateProfile = useCallback((updated) => {
        setCurrentUser(prev => {
            const merged = { ...(prev || {}), ...updated };
            return merged;
        });
    }, []);

    const stateAndActions = useMemo(() => ({
        currentUser, currentView, currentTheme, appPage, notes, joinedGroups, follows, dms,
        otherUserProfile, activeChat,
        isBanned, warningCount,
        DIRECTORY, GROUPS, followers,
        handleLogin, handleLogout, toggleTheme, changeView, toggleFollow,
        addNote, deleteNote, toggleGroupMembership, goToGroupChat, goToDirectChat,
        sendMessage,
        viewOtherProfile,
        deleteMessage, deleteChat,
        updateProfile,
        clearBanStatus,
        initialsFromName, findUserByld, formatSize,
        isCollegeEmail: (email) => String(email ||
            "").toLowerCase().endsWith(EMAIL_DOMAIN),
        titleCase,
        // Setters
        setAppPage,
    }), [
        currentUser, currentView, currentTheme, appPage, notes, joinedGroups, follows, dms,
        otherUserProfile, activeChat, isBanned, warningCount,
        handleLogin, handleLogout, toggleTheme, changeView, toggleFollow, addNote,
        deleteNote, toggleGroupMembership,
        goToGroupChat, goToDirectChat, sendMessage, viewOtherProfile, followers,
        updateProfile, clearBanStatus, deleteMessage, deleteChat
    ]);

    return stateAndActions;
};

const AppContext = React.createContext();

const useAppContext = () => React.useContext(AppContext);

// --- Auth Component (OTP logic preserved) ---

const Auth = ({ isLogin }) => {
    const { handleLogin, isCollegeEmail, titleCase, setAppPage } = useAppContext();
    const [authFlow, setAuthFlow] = useState(isLogin ? 'login' : 'create');

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [course, setCourse] = useState("");
    const [semYear, setSemYear] = useState("");
    const [alumni, setAlumni] = useState('No');
    const [otpCode, setOtpCode] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [resetEmail, setResetEmail] = useState("");

    const API_BASE_URL = 'http://localhost:5000/api'; // Define locally for fetch

    useEffect(() => {
        setEmail("");
        setPassword("");
        setError("");
        setMessage("");
        setLoading(false);
    }, [authFlow]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        if (!isCollegeEmail(email)) {
            setError(`Please use your college email (must end with ${EMAIL_DOMAIN}).`);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), password }),
            });

            const data = await response.json();
            if (data.success) handleLogin(data.user);
            else setError(data.message || 'Login failed.');

        } catch (err) {
            console.error('Login Error:', err);
            setError('Could not connect to the server. Please check the backend console.');
        } finally { setLoading(false); }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError(""); setMessage(""); setLoading(true);

        if (!isCollegeEmail(email) || password.length < 4 || !name || !course || !semYear) {
            setError('Please ensure all fields are valid and your password is at least 4 characters.');
            setLoading(false); return;
        }

        const userData = { name: titleCase(name), course, semYear, alumni, email: email.toLowerCase(), password };

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (data.success) {
                setAuthFlow('verify_otp');
                setResetEmail(email.toLowerCase());
                setMessage(data.message);
                setEmail("");
            } else setError(data.message || 'Registration failed.');

        } catch (err) {
            console.error('Registration/OTP Error:', err);
            setError('Could not connect to the server or sending email failed.');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(""); setMessage(""); setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otpCode }),
            });

            const data = await response.json();

            if (data.success) handleLogin(data.user);
            else setError(data.message || 'Verification failed.');

        } catch (err) {
            console.error('Verification Error:', err);
            setError('Could not connect to the server or verification failed.');
        } finally { setLoading(false); }
    };

    const handleForgotSendOtp = async (e) => {
        e.preventDefault(); setError(""); setMessage(""); setLoading(true);

        if (!isCollegeEmail(email)) {
            setError(`Please use your college email (must end with ${EMAIL_DOMAIN}).`);
            setLoading(false); return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            const data = await response.json();

            if (data.success) {
                setAuthFlow('reset_password');
                setResetEmail(email.toLowerCase());
                setMessage(data.message);
                setEmail("");
            } else setError(data.message || 'Error sending reset OTP.');

        } catch (err) {
            console.error('Forgot Password Error:', err);
            setError('Could not connect to the server or sending email failed.');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault(); setError(""); setMessage(""); setLoading(true);

        if (newPassword.length < 4) {
            setError('New password must be at least 4 characters long.'); setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otpCode, newPassword }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.message + ' You can now sign in.');
                setAuthFlow('login'); setNewPassword(""); setOtpCode(""); setResetEmail("");
            } else setError(data.message || 'Password reset failed.');

        } catch (err) {
            console.error('Reset Password Error:', err);
            setError('Could not connect to the server or reset failed.');
        } finally { setLoading(false); }
    };

    // --- Auth UI (Updated with new classNames for styling) ---
    if (authFlow === 'login') {
        return (
            <section id="page-login" className="page active">
                <div className="auth-card">
                    <div className="brand">
                        <i className="ri-chat-3-fill"></i>
                        <h1>Student Chat</h1>
                        <p className="muted">Welcome back! Please sign in with your college email.</p>
                    </div>
                    <form id="login-form" className="form" onSubmit={handleLoginSubmit}>
                        <div className="field">
                            <label htmlFor="login-email">College Email</label>
                            <input id="login-email" type="email"
                                placeholder="name.rollno@gehu.ac.in" required value={email} onChange={(e) =>
                                    setEmail(e.target.value)} disabled={loading} />
                        </div>
                        <div className="field">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="login-password">Password</label>
                                <button type="button" className="btn-link" onClick={() =>
                                    setAuthFlow('forgot_email')} style={{ color: 'var(--muted)', fontSize: '0.9rem' }}
                                    disabled={loading}>Forgot Password?</button>
                            </div>
                            <input id="login-password" type="password" placeholder="Set a secure password" required
                                value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                        </div>
                        <div className="actions two-col">
                            <button type="submit" className="btn primary" id="btn-signin"
                                disabled={loading}>
                                {loading ? <i
                                    className="ri-loader-4-line ri-spin"></i> : <i
                                    className="ri-login-circle-line"></i>}
                                {loading ? ' Signing In...' : ' Sign In'}
                            </button>
                            <button type="button" className="btn ghost" id="btn-goto-create"
                                onClick={() => setAuthFlow('create')} disabled={loading}>
                                <i className="ri-user-add-line"></i> Create Account
                            </button>
                        </div>
                        <p className={`error ${error ? '' : 'hidden'}`}>{error}</p>
                        <p className="success-message" style={{ color: 'var(--primary)', marginTop:
                            '10px' }}>{message}</p>
                    </form>
                </div>
            </section>
        );
    }

    if (authFlow === 'create') {
        return (
            <section id="page-create" className="page active">
                <div className="auth-card">
                    <div className="brand small">
                        <i className="ri-add-box-fill"></i>
                        <h2>Create Account</h2>
                        <p className="muted">Enter your details and set your password. We will verify your email with an OTP.</p>
                    </div>
                    <form id="create-form" className="form" onSubmit={handleRegisterSubmit}>
                        <div className="grid two">
                            <div className="field">
                                <label htmlFor="ca-name">Name</label>
                                <input id="ca-name" type="text" placeholder="Sakshi Chauhan" required
                                    value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                            </div>
                            <div className="field">
                                <label htmlFor="ca-course">Course</label>
                                <input id="ca-course" type="text" placeholder="B.Tech CSE" required
                                    value={course} onChange={(e) => setCourse(e.target.value)} disabled={loading} />
                            </div>
                        </div>
                        <div className="grid two">
                            <div className="field">
                                <label htmlFor="ca-sem-year">Semester & Year</label>
                                <input id="ca-sem-year" type="text" placeholder="Sem 5. 2025"
                                    required value={semYear} onChange={(e) => setSemYear(e.target.value)}
                                    disabled={loading} />
                            </div>
                            <div className="field">
                                <label htmlFor="ca-alumni">Alumni Status</label>
                                <select id="ca-alumni" required value={alumni} onChange={(e) =>
                                    setAlumni(e.target.value)} disabled={loading}>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="ca-email">College Email</label>
                            <input id="ca-email" type="email" placeholder="name.rollno@gehu.ac.in"
                                required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                        </div>
                        <div className="field">
                            <label htmlFor="ca-password">Create Password</label>
                            <input id="ca-password" type="password" placeholder="Set a secure password (min 4 chars)" required value={password} onChange={(e) =>
                                setPassword(e.target.value)} disabled={loading} />
                        </div>
                        <div className="actions end">
                            <button type="button" className="btn ghost" id="btn-cancel-create"
                                onClick={() => setAuthFlow('login')} disabled={loading}><i
                                    className="ri-arrow-left-line"></i> Back to Login</button>
                            <button type="submit" className="btn primary" id="btn-create-ok"
                                disabled={loading}>
                                {loading ? <i className="ri-loader-4-line ri-spin"></i> : <i
                                    className="ri-check-line"></i>}
                                {loading ? ' Sending OTP...' : ' OK (Send OTP)'}
                            </button>
                        </div>
                        <p className={`error ${error ? '' : 'hidden'}`}>{error}</p>
                    </form>
                </div>
            </section>
        );
    }

    if (authFlow === 'verify_otp') {
        return (
            <section id="page-verify" className="page active">
                <div className="auth-card">
                    <div className="brand small">
                        <i className="ri-mail-check-line"></i>
                        <h2>Verify Your Email</h2>
                        <p className="muted">Please enter the 6-digit code sent to
                            <strong>{resetEmail}</strong> for registration verification.</p>
                    </div>
                    <form className="form" onSubmit={handleVerifyOtp}>
                        <div className="field">
                            <label htmlFor="otp-code">Verification Code</label>
                            <input id="otp-code" type="text" inputMode="numeric" pattern="\d{6}"
                                placeholder="******" required value={otpCode} onChange={(e) =>
                                    setOtpCode(e.target.value)} maxLength={6} />
                        </div>
                        <div className="actions end">
                            <button type="button" className="btn ghost" onClick={() =>
                                setAuthFlow('create')}><i className="ri-arrow-left-line"></i> Go Back</button>
                            <button type="submit" className="btn primary"><i
                                className="ri-check-line"></i> Verify</button>
                        </div>
                        <p className={`error ${error ? '' : 'hidden'}`}>{error}</p>
                        <p className="success-message" style={{ color: 'var(--primary)', marginTop:
                            '10px' }}>{message}</p>
                    </form>
                </div>
            </section>
        );
    }

    if (authFlow === 'forgot_email') {
        return (
            <section id="page-forgot" className="page active">
                <div className="auth-card">
                    <div className="brand small">
                        <i className="ri-lock-password-line"></i>
                        <h2>Forgot Password</h2>
                        <p className="muted">Enter your college email to receive a password reset code.</p>
                    </div>
                    <form className="form" onSubmit={handleForgotSendOtp}>
                        <div className="field">
                            <label htmlFor="forgot-email">College Email</label>
                            <input id="forgot-email" type="email"
                                placeholder="name.rollno@gehu.ac.in" required value={email} onChange={(e) =>
                                    setEmail(e.target.value)} />
                        </div>
                        <div className="actions end">
                            <button type="button" className="btn ghost" onClick={() =>
                                setAuthFlow('login')}><i className="ri-arrow-left-line"></i> Back to Login</button>
                            <button type="submit" className="btn primary"><i
                                className="ri-mail-send-line"></i> Send Reset OTP</button>
                        </div>
                        <p className={`error ${error ? '' : 'hidden'}`}>{error}</p>
                        <p className="success-message" style={{ color: 'var(--primary)', marginTop:
                            '10px' }}>{message}</p>
                    </form>
                </div>
            </section>
        );
    }

    if (authFlow === 'reset_password') {
        return (
            <section id="page-reset" className="page active">
                <div className="auth-card">
                    <div className="brand small">
                        <i className="ri-key-2-line"></i>
                        <h2>Reset Password</h2>
                        <p className="muted">Code sent to <strong>{resetEmail}</strong>. Enter the code and your new password.</p>
                    </div>
                    <form className="form" onSubmit={handleResetPassword}>
                        <div className="field">
                            <label htmlFor="reset-otp-code">Verification Code</label>
                            <input id="reset-otp-code" type="text" inputMode="numeric" pattern="\d{6}"
                                placeholder="******" required value={otpCode} onChange={(e) =>
                                    setOtpCode(e.target.value)} maxLength={6} />
                        </div>
                        <div className="field">
                            <label htmlFor="reset-new-password">New Password</label>
                            <input id="reset-new-password" type="password" placeholder="Enter new password (min 4 chars)" required value={newPassword} onChange={(e) =>
                                setNewPassword(e.target.value)} />
                        </div>
                        <div className="actions end">
                            <button type="button" className="btn ghost" onClick={() =>
                                setAuthFlow('forgot_email')}><i className="ri-refresh-line"></i> Resend Code</button>
                            <button type="submit" className="btn primary"><i
                                className="ri-save-line"></i> Set New Password</button>
                        </div>
                        <p className={`error ${error ? '' : 'hidden'}`}>{error}</p>
                        <p className="success-message" style={{ color: 'var(--primary)', marginTop:
                            '10px' }}>{message}</p>
                    </form>
                </div>
            </section>
        );
    }
};

const Menultem = ({ target, icon, label, currentView, onClick }) => (
    <button className={`menu-item ${currentView === target ? 'active' : ""}`}
        data-target={target} onClick={() => onClick(target)}>
        <i className={icon}></i> {label}
    </button>
);

// --- Layout Component ---
const Layout = () => {
    const { currentUser, initialsFromName, handleLogout, toggleTheme, currentTheme,
        changeView, currentView, isBanned } = useAppContext();

    const ActiveView = ViewComponentMap[currentView];
    const isDark = currentTheme === 'dark';

    return (
        <section id="page-main" className="page active">
            <aside className="sidebar">
                <div className="user-mini" id="user-mini">
                    <div className="avatar"
                        id="avatar-initials">{initialsFromName(currentUser?.name || 'U')}</div>
                    <div className="meta">
                        <div id="mini-name">{currentUser?.name || 'User'}</div>
                        <div className="muted" id="mini-course">{currentUser?.course ||
                            'Course'}</div>
                    </div>
                </div>

                {isBanned && (
                    <div className="ban-alert">
                        <i className="ri-error-warning-line"></i> Profile Banned
                    </div>
                )}

                <nav className="menu" id="sidebar-menu">
                    <Menultem target="view-chats" icon="ri-chat-3-line" label="Direct Chats"
                        currentView={currentView} onClick={changeView} />
                    <Menultem target="view-groups" icon="ri-group-line" label="Groups"
                        currentView={currentView} onClick={changeView} />
                    <Menultem target="view-followers" icon="ri-user-follow-line" label="Followers"
                        currentView={currentView} onClick={changeView} />
                    <Menultem target="view-profile" icon="ri-user-3-line" label="My Profile"
                        currentView={currentView} onClick={changeView} />
                    <Menultem target="view-search" icon="ri-search-line" label="Search Students"
                        currentView={currentView} onClick={changeView} />
                    <Menultem target="view-upload" icon="ri-upload-2-line" label="Shared Files"
                        currentView={currentView} onClick={changeView} />
                    <Menultem target="view-alumni" icon="ri-graduation-cap-line" label="Alumni"
                        currentView={currentView} onClick={changeView} />
                </nav>

                <div className="spacer"></div>

                <button id="btn-theme-toggle" className="menu-item theme-toggle-btn" onClick={toggleTheme}>
                    <i className={isDark ? 'ri-sun-line' : 'ri-moon-line'}></i> {isDark ? 'Light Theme' : 'Dark Theme'}
                </button>

                <button id="btn-logout" className="menu-item danger" onClick={handleLogout}>
                    <i className="ri-logout-box-r-line"></i> Log out
                </button>
            </aside>

            <main className="content">
                {ActiveView && <ActiveView />}
            </main>
        </section>
    );
};

// --- View Components (Groups, Followers, etc.) ---

const Groups = () => {
    const { GROUPS, joinedGroups, toggleGroupMembership, goToGroupChat } =
        useAppContext();

    return (
        <section id="view-groups" className="view active">
            <header className="view-header">
                <h2><i className="ri-group-line"></i> Subject Groups</h2>
                <p className="muted">Join groups to connect with peers and share resources.</p>
            </header>
            <div className="card">
                <h3>Available Groups</h3>
                <ul id="groups-list" className="list">
                    {GROUPS.map(group => {
                        const isJoined = joinedGroups.includes(group.id);
                        return (
                            <li key={group.id} className={isJoined ? 'joined' : ""}>
                                <div className='group-meta'>
                                    <strong><i className={`${group.icon}`} style={{ color: 'var(--primary)', marginRight: '8px' }}></i>{group.name}</strong>
                                    <div className="sub">{group.description}</div>
                                </div>
                                <div className='group-actions'>
                                    {isJoined ? (
                                        <>
                                            <button className="btn primary small" onClick={() =>
                                                goToGroupChat(group.id)}><i className="ri-chat-3-line"></i> Chat</button>
                                            <button className="btn ghost small danger" onClick={() =>
                                                toggleGroupMembership(group.id)}>Leave</button>
                                        </>
                                    ) : (
                                        <button className="btn primary small" onClick={() =>
                                            toggleGroupMembership(group.id)}><i className="ri-add-line"></i> Join</button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
};

const Followers = () => {
    const { currentUser, followers, follows, findUserByld, viewOtherProfile, goToDirectChat,
        currentView, dms } = useAppContext();

    const followingUsers = follows.map(id => findUserByld(id)).filter(Boolean);
    const followerUsers = followers.map(id => findUserByld(id)).filter(Boolean);

    const renderDmsList = () => {
        const conversations = Object.keys(dms.dms || {})
            .filter(key => key.includes(currentUser.id)); // Only show DMs involving the current user

        if (!currentUser) return null; // Safety check

        // Sort conversations by the timestamp of the latest message
        const sortedConversations = conversations.sort((keyA, keyB) => {
            const messagesA = dms.dms[keyA] || [];
            const messagesB = dms.dms[keyB] || [];
            const timeA = messagesA[messagesA.length - 1]?.timestamp || 0;
            const timeB = messagesB[messagesB.length - 1]?.timestamp || 0;
            return new Date(timeB) - new Date(timeA);
        });


        if (sortedConversations.length === 0) return <li className="empty-state">Start a chat from a user's profile to see it here.</li>;

        return sortedConversations.map(key => {
            const otherUserId = key.split('-').find(id => id !== currentUser.id);
            const otherUser = findUserByld(otherUserId);

            if (!otherUser) return null;

            const messages = dms.dms[key] || [];
            const lastMessage = messages[messages.length - 1];

            return (
                <li key={key} onClick={() => goToDirectChat(otherUser.id)} className="chat-preview-item">
                    <div className="avatar small">{initialsFromName(otherUser.name)}</div>
                    <div className='chat-meta'>
                        <strong>{otherUser.name}</strong>
                        <div className="sub">{lastMessage ? (lastMessage.text.length > 40 ?
                            lastMessage.text.substring(0, 37) + '...' : lastMessage.text) : 'New Chat'}</div>
                    </div>
                </li>
            );
        });
    };

    if (currentView === 'view-chats') {
        return (
            <section id="view-chats" className="view active">
                <header className="view-header">
                    <h2><i className="ri-chat-3-line"></i> Direct Messages</h2>
                </header>
                <div className="card full-height-card">
                    <h3>Your Conversations</h3>
                    <ul id="dms-list" className={`list ${followingUsers.length === 0 ? 'empty-state' : ""}`}>
                        {renderDmsList()}
                    </ul>
                </div>
            </section>
        );
    }

    return (
        <section id="view-followers" className="view active">
            <header className="view-header">
                <h2><i className="ri-user-follow-line"></i> Followers & Following</h2>
            </header>
            <div className="card">
                <h3>Users You Follow (<span
                    id="following-count">{followingUsers.length}</span>)</h3>
                <ul id="following-list" className={`list ${followingUsers.length === 0 ?
                    'empty-state' : ""}`}>
                    {followingUsers.length === 0 ? (<li>You are not following anyone yet.</li>) :
                        (followingUsers.map(user => (
                            <li key={user.id} onClick={() => viewOtherProfile(user.id)} className='list-item-with-avatar'>
                                <div className='list-item-meta'>
                                    <strong>{user.name}</strong><div className="sub">{user.course}</div>
                                </div>
                                <i className="ri-arrow-right-s-line muted-icon"></i>
                            </li>
                        )))}
                </ul>
            </div>

            {/* Only show followers block if there are followers */}
            {followerUsers.length > 0 && (
                <div className="card" style={{ marginTop: '16px' }}>
                    <h3>Your Followers (<span
                        id="followers-count">{followerUsers.length}</span>)</h3>
                    <ul id="followers-list" className={'list'}>
                        {followerUsers.map(user => (
                            <li key={user.id} onClick={() => viewOtherProfile(user.id)} className='list-item-with-avatar'>
                                <div className='list-item-meta'>
                                    <strong>{user.name}</strong><div
                                        className="sub">{user.course}</div>
                                </div>
                                <i className="ri-arrow-right-s-line muted-icon"></i>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

const ChatView = ({ type }) => {
    const { currentUser, dms, activeChat, GROUPS, findUserByld, changeView,
        sendMessage, deleteMessage, deleteChat, isBanned, warningCount } = useAppContext();

    const [messageText, setMessageText] = useState("");


    const chatWindowRef = useRef(null);

    const isGroupChat = type === 'group';
    const chatId = activeChat.id;

    let chatTarget = null;
    let chatName = 'Loading...';
    let chatIcon = isGroupChat ? 'ri-group-line' : 'ri-user-line';
    let backTarget = isGroupChat ? 'view-groups' : 'view-chats';
    let messages = [];

    if (chatId) {
        if (isGroupChat) {
            chatTarget = GROUPS.find(g => g.id === chatId);
            chatName = chatTarget ? `${chatTarget.name} Group Chat` : 'Unknown Group';
            chatIcon = chatTarget ? chatTarget.icon : 'ri-group-line';
            messages = dms.groups?.[chatId] || [];
        } else {
            chatTarget = findUserByld(chatId);
            chatName = chatTarget ? `Chat with ${chatTarget.name}` : 'Unknown User';

            const chatKey = [currentUser.id, chatId].sort().join('-');
            messages = dms.dms?.[chatKey] || [];
        }
    }

   
    useEffect(() => {
        if (chatWindowRef.current) chatWindowRef.current.scrollTop =
            chatWindowRef.current.scrollHeight;
    }, [messages.length, chatId]); 
    const handleSend = (e) => {
        e.preventDefault();
        const text = messageText.trim();
        if (text) {
            sendMessage(text, type, chatId);
            setMessageText("");
        }
    };

    const getSenderName = (id) => {
        if (id === 'sys_warn') return 'System Warning';
        if (id === 'sys_spam') return 'Spam Filter Alert';
        if (id === 'demo_bot') return 'Group Bot';
        return findUserByld(id)?.name || 'Unknown User';
    };

    return (
        <section id={isGroupChat ? 'view-group-chat' : 'view-direct-chat'} className="view active chat-view">
            <header className="view-header chat-header">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button className="btn ghost icon-btn" onClick={() => changeView(backTarget)}><i
                        className="ri-arrow-left-line"></i></button>
                    <div className='chat-title'>
                        <i className={chatIcon}></i>
                        <h2 id={isGroupChat ? 'group-chat-name' : 'direct-chat-name'}>{chatName}</h2>
                    </div>
                </div>

                {chatId && <div>
                    <button className="btn ghost danger small" onClick={() => deleteChat(isGroupChat
                        ? 'group' : 'dm', chatId)}><i className="ri-delete-bin-line"></i> Delete Chat</button>
                </div>}
            </header>

            <div className="chat-window" ref={chatWindowRef}>
                {messages.length === 0 ? (
                    <div className="message bot"><div className="bubble">This is the start of your chat. Say hello!</div></div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;
                        const isSystemAlert = msg.senderId === 'sys_warn' || msg.senderId === 'sys_spam';
                        const isRuleBasedReply = !isGroupChat && msg.senderId === chatId;
                        const isSpamAlert = msg.senderId === 'sys_spam';

                        let senderName = null;
                        if (isGroupChat && !isMe) senderName = getSenderName(msg.senderId).split(' ')[0];

                        let bubbleStyle = {};
                        if (isSystemAlert) {
                            bubbleStyle = isSpamAlert 
                                ? { backgroundColor: 'var(--warning-soft)', color: 'var(--warning-dark)', border: '1px solid var(--warning-dark)' }
                                : { backgroundColor: 'var(--danger-soft)', color: 'var(--danger-dark)', border: '1px solid var(--danger-dark)' };
                        }

                        return (
                            <div key={msg.id} className={`message ${isMe ? 'me' : isSystemAlert ? 'system-alert' : ''}`}>
                                <div className="bubble" style={bubbleStyle}>
                                    {(isSystemAlert || senderName) && <div className='sender-label'>
                                        {isSystemAlert ? getSenderName(msg.senderId) : senderName}
                                    </div>}

                                    {/* Handle markdown for rule-based replies */}
                                    {isRuleBasedReply && !isGroupChat ? (
                                        <div dangerouslySetInnerHTML={{
                                            __html:
                                                msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        }} />
                                    ) : (
                                        msg.text
                                    )}

                                    <div className='message-meta'>
                                        <span className="muted-time" style={{ color: isSystemAlert ? 'inherit' : 'var(--muted)' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>

                                        {(isMe || isRuleBasedReply || isSystemAlert) && (
                                            <button className="btn ghost small danger delete-msg-btn" onClick={() =>
                                                deleteMessage(isGroupChat ? 'group' : 'dm', chatId, msg.id)}>
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form id={isGroupChat ? 'group-chat-form' : 'direct-chat-form'}
                className="chat-input" onSubmit={handleSend}>
                <textarea
                    id={isGroupChat ? 'group-chat-text' : 'direct-chat-text'}
                    rows="2"
                    placeholder={isBanned ? "You are banned and cannot send messages." : "Type a message..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isBanned} // Disable input if banned
                ></textarea>
                <button className="btn primary" type="submit" disabled={isBanned || messageText.trim() === ''}><i
                    className="ri-send-plane-2-line"></i> Send</button>
            </form>

            {!isBanned && warningCount > 0 && (
                <div className='warning-footer'>
                    Policy Warning Count: **{warningCount} / 2** (Next offense results in ban)
                </div>
            )}
        </section>
    );
};



const ProfileField = ({ label, value, isEditing, InputComp }) => (
    <div className={`field ${isEditing ? "" : 'readonly'}`}>
        <label>{label}</label>
        {isEditing ? InputComp : <div className="readonly-box">{value || '-'}</div>}
    </div>
);

const Profile = () => {
    const { currentUser, initialsFromName, addNote, notes, deleteNote, formatSize,
        updateProfile, isBanned, clearBanStatus } = useAppContext();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentUser?.name || "");
    const [course, setCourse] = useState(currentUser?.course || "");
    const [semYear, setSemYear] = useState(currentUser?.semYear || "");
    const [alumni, setAlumni] = useState(currentUser?.alumni || 'No');

   
    const profileFileInputRef = useRef(null);

    useEffect(() => {
        setName(currentUser?.name || "");
        setCourse(currentUser?.course || "");
        setSemYear(currentUser?.semYear || "");
        setAlumni(currentUser?.alumni || 'No');
    }, [currentUser]);

    const myNotes = notes.filter(n => n.ownerId === currentUser?.id && !n.isGlobal);

    const handleSave = (e) => {
        e.preventDefault();
        updateProfile({ name, course, semYear, alumni });
        setIsEditing(false);
    };

    const handleFileUpload = (e) => {
        e.preventDefault();
        if (profileFileInputRef.current && profileFileInputRef.current.files.length) {
            addNote(profileFileInputRef.current.files[0], false);
            profileFileInputRef.current.value = "";
        }
    };

    const renderNoteItem = (n) => (
        <li key={n.id} className="file-item">
            <div className='file-meta'>
                <strong>{n.name}</strong>
                <div className="sub">{formatSize(n.size)} &bull; {new
                    Date(n.uploadedAt).toLocaleDateString()}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <a href={n.url} target="_blank" rel="noreferrer" className="btn ghost small">View</a>
                <a href={n.url} download={n.name} className="btn primary small">Download</a>
                <button className="btn ghost small danger" onClick={() =>
                    deleteNote(n.id)}>Delete</button>
            </div>
        </li>
    );

    return (
        <section id="view-profile" className="view active">
            <header className="view-header">
                <h2><i className="ri-user-3-line"></i> My Profile</h2>
                <button id="btn-edit-profile" className={`btn primary ${isEditing ? 'hidden' : ""}`}
                    onClick={() => setIsEditing(true)}><i className="ri-edit-line"></i> Edit</button>
            </header>

            <form id="profile-form" className="card" onSubmit={handleSave}>
                <div className="user-mini large" style={{ marginBottom: '16px', padding: '10px 0' }}>
                    <div className="avatar large"
                        id="avatar-initials">{initialsFromName(currentUser?.name)}</div>
                    <div className="meta large">
                        <h3>{currentUser?.name}</h3>
                        <p className="muted">{currentUser?.email}</p>
                    </div>
                </div>

                {isBanned && (
                    <div className="ban-profile-alert">
                        <i className="ri-alert-line"></i> **BANNED:** You cannot send messages due to policy violations.
                        <button
                            type="button"
                            className="btn primary small"
                            onClick={clearBanStatus}
                            style={{ marginTop: '8px' }}
                        >
                            <i className="ri-refresh-line"></i> Reset Ban Status (Demo Only)
                        </button>
                    </div>
                )}

                <div className="grid two">
                    <ProfileField label="Name" value={currentUser?.name} isEditing={isEditing}
                        InputComp={<input type="text" value={name} onChange={e => setName(e.target.value)}
                            required />} />

                    <ProfileField label="Course" value={currentUser?.course} isEditing={isEditing}
                        InputComp={<input type="text" value={course} onChange={e => setCourse(e.target.value)}
                            required />} />
                </div>

                <div className="grid two">
                    <ProfileField label="Semester & Year" value={currentUser?.semYear}
                        isEditing={isEditing} InputComp={<input type="text" value={semYear} onChange={e =>
                            setSemYear(e.target.value)} required />} />

                    <ProfileField label="Alumni" value={currentUser?.alumni} isEditing={isEditing}
                        InputComp={<select value={alumni} onChange={e => setAlumni(e.target.value)}><option
                            value="No">No</option><option value="Yes">Yes</option></select>} />

                </div>

                <div className={`actions end ${isEditing ? "" : 'hidden'}`} id="pf-actions">
                    <button type="button" className="btn ghost" id="btn-cancel-profile-edit"
                        onClick={() => setIsEditing(false)}><i className="ri-close-line"></i> Cancel</button>
                    <button type="submit" className="btn primary" id="btn-save-profile"><i
                        className="ri-save-line"></i> Save Profile</button>
                </div>
            </form>

            <div className="card">
                <h3><i className="ri-sticky-note-line"></i> Notes Upload (My Files)</h3>
                <form id="profile-upload-form" className="form-inline"
                    onSubmit={handleFileUpload}>
                    <input id="pf-file" type="file" ref={profileFileInputRef} />
                    <button type="submit" className="btn primary"><i className="ri-upload-2-line"></i>
                        Upload</button>
                </form>

                <ul id="pf-notes-list" className={`file-list ${myNotes.length === 0 ? 'empty-state-list' : ""}`}>
                    {myNotes.length === 0 ? <li>No notes uploaded yet. </li> :
                        myNotes.map(renderNoteItem)}
                </ul>
            </div>
        </section>
    );
};

const Search = () => {
    const { DIRECTORY, currentUser, viewOtherProfile } = useAppContext();
    const [query, setQuery] = useState("");

    const results = useMemo(() => {
        const q = query.toLowerCase();
        if (!q) return [];
        return DIRECTORY.filter(p => p.id !== currentUser.id)
            .filter(p => p.name.toLowerCase().includes(q) || p.course.toLowerCase().includes(q)
                || p.email.toLowerCase().includes(q));
    }, [query, currentUser]);

    return (
        <section id="view-search" className="view active">
            <header className="view-header"><h2><i className="ri-search-line"></i> Search Students</h2></header>
            <div className="card">
                <div className="form-inline">
                    <input id="search-input" type="text" placeholder="Search by name/course/email..." value={query} onChange={e => setQuery(e.target.value)} />
                    <button id="search-btn" className="btn primary" onClick={() => { }}><i
                        className="ri-search-line"></i> Search</button>
                </div>

                <ul id="search-results" className={`list ${query && results.length > 0 ? '' : 'empty-state-list'}`}>
                    {query && results.length > 0 ? results.map(p => (
                        <li key={p.id} onClick={() => viewOtherProfile(p.id)} className='list-item-with-avatar'>
                            <div className='list-item-meta'>
                                <strong>{p.name}</strong>
                                <div className="sub">{p.course} {p.semYear}</div>
                            </div>
                            <span className="badge">{p.alumni === 'Yes' ? 'Alumni' :
                                'Student'}</span>
                        </li>
                    )) : query ? (<li>No results found matching "{query}".</li>) : (<li>Start typing to search for students.</li>)}
                </ul>
            </div>
        </section>
    );
};

const Alumni = () => {
    const { DIRECTORY, viewOtherProfile } = useAppContext();
    const [query, setQuery] = useState("");

    const results = useMemo(() => {
        const q = query.toLowerCase();
        const allAlumni = DIRECTORY.filter(p => p.alumni === 'Yes');

        return allAlumni.filter(p => !q || p.name.toLowerCase().includes(q) ||
            p.course.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }, [query]);

    return (
        <section id="view-alumni" className="view active">
            <header className="view-header"><h2><i className="ri-graduation-cap-line"></i>
                Alumni Directory</h2><p className="muted">Search and connect with college alumni.</p></header>

            <div className="card">
                <div className="form-inline">
                    <input id="alumni-search" type="text" placeholder="Search alumni by name, course, or email..." value={query} onChange={e => setQuery(e.target.value)} />
                    <button className="btn primary"><i className="ri-search-line"></i>
                        Search</button>
                </div>

                <ul id="alumni-list" className={`list ${results.length > 0 ? '' : 'empty-state-list'}`}>
                    {results.length > 0 ? results.map(p => (
                        <li key={p.id} onClick={() => viewOtherProfile(p.id)} className='list-item-with-avatar'>
                            <div className='list-item-meta'>
                                <strong>{p.name}</strong>
                                <div className="sub">{p.course} {p.semYear}</div>
                            </div>
                            <span className="badge">Alumni</span>
                        </li>
                    )) : (<li>No alumni found matching your criteria.</li>)}
                </ul>
            </div>
        </section>
    );
};

const OtherProfile = () => {
    const { otherUserProfile: user, initialsFromName, toggleFollow, follows, goToDirectChat,
        changeView, formatSize, notes } = useAppContext();

    if (!user) return <div className="card">Loading profile...</div>;

    const isFollowing = follows.includes(user.id);
    const userNotes = notes.filter(n => n.ownerId === user.id && !n.isGlobal);

    return (
        <section id="view-other-profile" className="view active">
            <header className="view-header">

                <h2><i className="ri-user-3-line"></i> <span
                    id="other-profile-name-header">{user.name}</span></h2>

                <button id="btn-back-to-search" className="btn ghost small" onClick={() =>
                    changeView('view-search')}><i className="ri-arrow-left-line"></i> Back</button>

            </header>

            <div className="card">
                <div className="user-mini large" id="other-user-mini" style={{ marginBottom: '16px', padding: '10px 0' }}>
                    <div className="avatar large"
                        id="other-avatar-initials">{initialsFromName(user.name)}</div>
                    <div className="meta large"><h3 id="other-name">{user.name}</h3><p
                        className="muted" id="other-email">{user.email}</p></div>
                </div>

                <div className="actions" style={{ justifyContent: 'center', marginBottom: '12px' }}>
                    {isFollowing ? (
                        <button id="btn-unfollow" className="btn ghost danger" onClick={() =>
                            toggleFollow(user.id)}><i className="ri-user-unfollow-line"></i> Unfollow</button>
                    ) : (<button id="btn-follow" className="btn primary" onClick={() =>
                        toggleFollow(user.id)}><i className="ri-user-add-line"></i> Follow</button>)}
                    <button id="btn-start-dm" className="btn primary ghost" onClick={() =>
                        goToDirectChat(user.id)}><i className="ri-chat-3-line"></i> Chat</button>
                </div>

                <div className="grid two profile-fields-grid">
                    <div className="field readonly"><label>Course</label><div
                        className="readonly-box">{user.course || '-'}</div></div>

                    <div className="field readonly"><label>Semester & Year</label><div
                        className="readonly-box">{user.semYear || '-'}</div></div>

                </div>
                <div className="field readonly"><label>Alumni Status</label><div
                    className="readonly-box">{user.alumni || 'No'}</div></div>

            </div>

            <div className="card">
                <h3><i className="ri-download-line"></i> Notes Shared by <span
                    id="other-name-notes">{user.name.split(' ')[0]}</span></h3>

                <ul id="other-notes-list" className={`file-list ${userNotes.length === 0 ?
                    'empty-state-list' : ""}`}>

                    {userNotes.length === 0 ? (<li>This user hasn't shared any files yet.</li>) :
                        (userNotes.map(n => (
                            <li key={n.id} className="file-item">
                                <div className='file-meta'><strong>{n.name}</strong><div
                                    className="sub">{formatSize(n.size)} &bull; {new
                                        Date(n.uploadedAt).toLocaleDateString()}</div></div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <a href={n.url} target="_blank" rel="noreferrer" className="btn ghost small">View</a>
                                    <a href={n.url} download={n.name} className="btn primary small">Download</a>
                                </div>
                            </li>
                        )))}

                </ul>
            </div>
        </section>
    );
};

const Upload = () => {
    const { addNote, deleteNote, notes, formatSize } = useAppContext();
    const fileRef = useRef(null);

    const [isGlobal, setIsGlobal] = useState(false);

    const globalNotes = notes.filter(n => n.isGlobal);
    const myNotes = notes.filter(n => !n.isGlobal);

    const handleUpload = (e) => {
        e.preventDefault();
        // NOTE: Changed fileInputRef to fileRef for consistency
        if (fileRef.current && fileRef.current.files.length) {
            addNote(fileRef.current.files[0], isGlobal);
            fileRef.current.value = "";
        }
    };

    const renderNoteItem = (n) => (
        <li key={n.id} className="file-item">
            <div className='file-meta'>
                <strong>{n.name}</strong>
                <div className="sub">{formatSize(n.size)} &bull; {new
                    Date(n.uploadedAt).toLocaleDateString()}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <a href={n.url} target="_blank" rel="noreferrer" className="btn ghost small">View</a>
                <a href={n.url} download={n.name} className="btn primary small">Download</a>
                {/* Only allow deleting if it's not a global note for a simple demo */}
                <button className="btn ghost small danger" onClick={() => deleteNote(n.id)}>Delete</button>

            </div>
        </li>
    );

    return (
        <section id="view-upload" className="view active">
            <header className="view-header"><h2><i className="ri-upload-2-line"></i>
                Shared Files</h2><p className="muted">Upload notes, PPTs, or files. Others can view/download.</p></header>

            <div className="card">
                <form className="form-inline" onSubmit={handleUpload}>
                    <input type="file" ref={fileRef} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={isGlobal} onChange={(e) =>
                            setIsGlobal(e.target.checked)} /> Share globally (Public)
                    </label>
                    <button className="btn primary" type="submit"><i className="ri-upload-2-line"></i>
                        Upload</button>
                </form>

                <h3 style={{ marginTop: 16 }}>Global Files (Shared by All)</h3>
                <ul className={`file-list ${globalNotes.length === 0 ? 'empty-state-list' : ""}`}>
                    {globalNotes.length === 0 ? <li className="empty-state">No shared files yet.</li> : globalNotes.map(renderNoteItem)}
                </ul>

                <h3 style={{ marginTop: 16 }}>My Private Files</h3>
                <ul className={`file-list ${myNotes.length === 0 ? 'empty-state-list' : ""}`}>
                    {myNotes.length === 0 ? <li className="empty-state">No files uploaded yet.</li> : myNotes.map(renderNoteItem)}
                </ul>
            </div>
        </section>
    );
};


const ViewComponentMap = {
    'view-chats': Followers,
    'view-groups': Groups,
    'view-followers': Followers,
    'view-profile': Profile,
    'view-search': Search,
    'view-upload': Upload,
    'view-alumni': Alumni,
    'view-other-profile': OtherProfile,
    'view-direct-chat': () => <ChatView type="dm" />,
    'view-group-chat': () => <ChatView type="group" />,
};

const App = () => {
    const stateAndActions = useAppState();
    const { appPage } = stateAndActions;

    let componentToRender;

    if (appPage === 'login' || appPage === 'create') {
        componentToRender = <Auth isLogin={appPage === 'login'} />;
    } else {
        componentToRender = <Layout />;
    }

    return (
        <AppContext.Provider value={stateAndActions}>
            <div id="app">{componentToRender}</div>
        </AppContext.Provider>
    );
};

export default App;