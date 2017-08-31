
#slspress-config-loader

Loads environment config from a env config yaml file, a secret file and environment properties 
merging them together.

The idea is that the serverless.yml file can reference a file that calls this to load config that 
is then available in the serverless.yml file

For example:

 
serverless.yml:
```yaml
custom:
  conf: ${file(./config/config-loader-${opt:stage}.js):config}

provider:
  region: ${self:custom.conf.region}
  vpc: ${self:custom.conf.vpc}
  environment: ${self:custom.conf.env}
  
...
```

config/config-loader-development.js:
```javascript
module.exports.config = () => require('slspress-config-loader')(__dirname, 'development');
```

config/config.development.yml:
```yaml
region: "us-east-1"
vpc:
  securityGroupIds:
    - ""
  subnetIds:
    - ""
    - ""
env:
  SOME_CONFIG: "config-value"
```

config/config.development.secret.yml: // added to .gitignore
```yaml
env:
  SOME_SECRET_KEY: "shhh"
```