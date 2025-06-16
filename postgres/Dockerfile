FROM postgres:16

# Copy configuration and initialization scripts
COPY postgres.conf /usr/local/etc/postgres/postgres.conf
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Set command to use custom config
CMD ["postgres", "-c", "config_file=/usr/local/etc/postgres/postgres.conf"]