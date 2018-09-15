create table if not exists users (
  uid_ serial not null primary key,
  uname varchar(16) not null unique,
  upassword varchar(16) not null,
  ubirthday timestamp not null
);

create table if not exists news (
  nid serial not null primary key,
  ntitle varchar(256) not null,
  ndescription varchar(512) not null,
  nauthor varchar(128) not null,
  nurl varchar(2083) not null,
  nimage varchar(2083) not null,
  npublished timestamp not null,
  nfound timestamp not null
);
