// MongoDB initialization script
db = db.getSiblingDB('campusconnect');

// Create application user
db.createUser({
  user: 'campusapp',
  pwd: 'apppassword123',
  roles: [
    {
      role: 'readWrite',
      db: 'campusconnect'
    }
  ]
});

// Create initial collections with basic indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.createCollection('posts');
db.posts.createIndex({ author: 1 });
db.posts.createIndex({ createdAt: -1 });

db.createCollection('events');
db.events.createIndex({ date: 1 });
db.events.createIndex({ category: 1 });

print('Database initialized successfully!');