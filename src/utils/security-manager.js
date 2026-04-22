import crypto from 'crypto';

class SecurityManager {
    constructor() {
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.tokens = new Map();
        this.events = new Map();
        this.config = {
            tokenExpiration: 3600, // 1 hour
            saltRounds: 10,
            algorithm: 'aes-256-gcm',
            secretKey: crypto.randomBytes(32),
            iv: crypto.randomBytes(16)
        };
    }

    authenticate(credentials) {
        try {
            if (!credentials) {
                console.error('Invalid credentials provided');
                return null;
            }

            const { username, password } = credentials;
            if (!username || !password) {
                console.error('Missing username or password');
                return null;
            }

            const user = this.users.get(username);
            if (!user) {
                console.error('User not found');
                return null;
            }

            const isValid = this.verifyPassword(password, user.password);
            if (!isValid) {
                console.error('Invalid password');
                return null;
            }

            const token = this.generateToken(user);
            this.emit('authenticate', { username });
            return token;
        } catch (error) {
            console.error('Error authenticating user:', error);
            return null;
        }
    }

    authorize(token, permission) {
        try {
            if (!token) {
                console.error('Invalid token provided');
                return false;
            }
            if (!permission) {
                console.error('Invalid permission provided');
                return false;
            }

            const tokenData = this.validateToken(token);
            if (!tokenData) {
                console.error('Invalid or expired token');
                return false;
            }

            const user = this.users.get(tokenData.username);
            if (!user) {
                console.error('User not found');
                return false;
            }

            const hasPermission = this.checkPermission(user.role, permission);
            this.emit('authorize', { username: user.username, permission, granted: hasPermission });
            return hasPermission;
        } catch (error) {
            console.error('Error authorizing user:', error);
            return false;
        }
    }

    hashPassword(password) {
        try {
            if (!password) {
                console.error('Invalid password provided');
                return null;
            }

            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            return `${salt}:${hash}`;
        } catch (error) {
            console.error('Error hashing password:', error);
            return null;
        }
    }

    verifyPassword(password, hashedPassword) {
        try {
            if (!password || !hashedPassword) {
                console.error('Invalid password or hash provided');
                return false;
            }

            const [salt, hash] = hashedPassword.split(':');
            const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            return hash === verifyHash;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }

    generateToken(user) {
        try {
            if (!user) {
                console.error('Invalid user provided');
                return null;
            }

            const payload = {
                username: user.username,
                role: user.role,
                exp: Date.now() + (this.config.tokenExpiration * 1000)
            };

            const token = this.encrypt(JSON.stringify(payload));
            this.tokens.set(token, payload);
            this.emit('tokenGenerated', { username: user.username });
            return token;
        } catch (error) {
            console.error('Error generating token:', error);
            return null;
        }
    }

    validateToken(token) {
        try {
            if (!token) {
                console.error('Invalid token provided');
                return null;
            }

            const payload = this.tokens.get(token);
            if (!payload) {
                console.error('Token not found');
                return null;
            }

            if (payload.exp < Date.now()) {
                this.tokens.delete(token);
                console.error('Token expired');
                return null;
            }

            return payload;
        } catch (error) {
            console.error('Error validating token:', error);
            return null;
        }
    }

    addUser(username, password, role) {
        try {
            if (!username || !password || !role) {
                console.error('Invalid user data provided');
                return false;
            }

            if (this.users.has(username)) {
                console.error('User already exists');
                return false;
            }

            const hashedPassword = this.hashPassword(password);
            this.users.set(username, {
                username,
                password: hashedPassword,
                role
            });

            this.emit('userAdded', { username });
            return true;
        } catch (error) {
            console.error('Error adding user:', error);
            return false;
        }
    }

    addRole(role, permissions) {
        try {
            if (!role || !permissions) {
                console.error('Invalid role data provided');
                return false;
            }

            if (this.roles.has(role)) {
                console.error('Role already exists');
                return false;
            }

            this.roles.set(role, new Set(permissions));
            this.emit('roleAdded', { role });
            return true;
        } catch (error) {
            console.error('Error adding role:', error);
            return false;
        }
    }

    addPermission(permission, description) {
        try {
            if (!permission) {
                console.error('Invalid permission provided');
                return false;
            }

            if (this.permissions.has(permission)) {
                console.error('Permission already exists');
                return false;
            }

            this.permissions.set(permission, description);
            this.emit('permissionAdded', { permission });
            return true;
        } catch (error) {
            console.error('Error adding permission:', error);
            return false;
        }
    }

    checkPermission(role, permission) {
        try {
            if (!role || !permission) {
                console.error('Invalid role or permission provided');
                return false;
            }

            const rolePermissions = this.roles.get(role);
            if (!rolePermissions) {
                console.error('Role not found');
                return false;
            }

            return rolePermissions.has(permission);
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    encrypt(data) {
        try {
            if (!data) {
                console.error('Invalid data provided');
                return null;
            }

            const cipher = crypto.createCipheriv(
                this.config.algorithm,
                this.config.secretKey,
                this.config.iv
            );

            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();

            return `${encrypted}:${authTag.toString('hex')}:${this.config.iv.toString('hex')}`;
        } catch (error) {
            console.error('Error encrypting data:', error);
            return null;
        }
    }

    decrypt(data) {
        try {
            if (!data) {
                console.error('Invalid data provided');
                return null;
            }

            const [encrypted, authTag, iv] = data.split(':');
            const decipher = crypto.createDecipheriv(
                this.config.algorithm,
                this.config.secretKey,
                Buffer.from(iv, 'hex')
            );

            decipher.setAuthTag(Buffer.from(authTag, 'hex'));

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    }

    on(event, handler) {
        try {
            if (!event) {
                console.error('Invalid event name provided');
                return;
            }
            if (!handler || typeof handler !== 'function') {
                console.error('Invalid event handler provided');
                return;
            }

            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            this.events.get(event).add(handler);
        } catch (error) {
            console.error('Error adding event handler:', error);
        }
    }

    emit(event, data) {
        try {
            if (this.events.has(event)) {
                for (const handler of this.events.get(event)) {
                    handler(data);
                }
            }
        } catch (error) {
            console.error('Error emitting event:', error);
        }
    }

    revokeToken(token) {
        try {
            if (!token) {
                console.error('Invalid token provided');
                return false;
            }

            const result = this.tokens.delete(token);
            if (result) {
                this.emit('tokenRevoked', { token });
            }
            return result;
        } catch (error) {
            console.error('Error revoking token:', error);
            return false;
        }
    }

    updatePassword(username, oldPassword, newPassword) {
        try {
            if (!username || !oldPassword || !newPassword) {
                console.error('Invalid password update data provided');
                return false;
            }

            const user = this.users.get(username);
            if (!user) {
                console.error('User not found');
                return false;
            }

            if (!this.verifyPassword(oldPassword, user.password)) {
                console.error('Invalid old password');
                return false;
            }

            user.password = this.hashPassword(newPassword);
            this.users.set(username, user);
            this.emit('passwordUpdated', { username });
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            return false;
        }
    }

    getUser(username) {
        try {
            if (!username) {
                console.error('Invalid username provided');
                return null;
            }

            const user = this.users.get(username);
            if (!user) {
                console.error('User not found');
                return null;
            }

            const { password, ...userData } = user;
            return userData;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    getRolePermissions(role) {
        try {
            if (!role) {
                console.error('Invalid role provided');
                return null;
            }

            const permissions = this.roles.get(role);
            if (!permissions) {
                console.error('Role not found');
                return null;
            }

            return Array.from(permissions);
        } catch (error) {
            console.error('Error getting role permissions:', error);
            return null;
        }
    }
}

export default SecurityManager; 