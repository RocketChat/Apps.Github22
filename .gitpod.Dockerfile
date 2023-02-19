FROM gitpod/workspace-base:latest

USER root

RUN wget -O - -c https://github.com/henit-chobisa/Thrust.RC/releases/download/v2.0.3/thrust.RC_2.0.3_Linux_amd64.tar.gz | tar -xz -C /usr/local/bin 

RUN mv /usr/local/bin/thrust.RC /usr/local/bin/thrust