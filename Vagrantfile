# -*- mode: ruby -*-
# vi: set ft=ruby :

# This Vagrantfile exists to test packaging. Read more about its use in the
# vagrant section in TESTING.asciidoc.

# Licensed to Elasticsearch under one or more contributor
# license agreements. See the NOTICE file distributed with
# this work for additional information regarding copyright
# ownership. Elasticsearch licenses this file to you under
# the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

Vagrant.configure(2) do |config|
  
  config.vm.define "buildhost" do |config|
    config.vm.box = "elastic/ubuntu-16.04-x86_64"
    config.vm.provider "virtualbox" do |v|
      # Give the box 4GB because our build tools are beasts
      v.memory = 4096
    end

  end
end