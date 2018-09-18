create table if not exists todos {
  tid serial not null primary key,
  ttitle varchar(256) not null,
  tcomplete boolean not null
}
