CREATE TABLE users (
    id_users INT NOT NULL AUTO_INCREMENT,
    use_name VARCHAR(30) NOT NULL,
    use_lastname VARCHAR(30) NOT NULL,
    use_email TEXT NOT NULL,
    use_password TEXT NOT NULL,
    use_level INT(2) NOT NULL,
    use_mobile INT(10) NOT NULL,
    use_picture TEXT,
    use_deleteHashPicture TEXT,
    use_numberefe INT (2) NOT NULL,
    use_status INT NOT NULL,
    use_exchange_status INT NOT NULL,
    PRIMARY KEY (id_users)
);

CREATE TABLE referrals (
    id_referrals INT NOT NULL AUTO_INCREMENT,
    id_referred INT NOT NULL,
    id_sponsor INT NOT NULL,
    PRIMARY KEY (id_referrals),
    FOREIGN KEY (id_referred) REFERENCES users(id_users),
    FOREIGN KEY (id_sponsor) REFERENCES users(id_users)
);

CREATE TABLE notifications (
    id_notifications INTEGER NOT NULL AUTO_INCREMENT,
    id_users INTEGER NOT NULL,
    not_message TEXT NOT NULL,
    not_status INTEGER NOT NULL,
    PRIMARY KEY (id_notifications),
    FOREIGN KEY (id_users) REFERENCES users(id_users)
);