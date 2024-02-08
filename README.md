# Prerequisites
1. Install Docker -> https://www.docker.com/products/docker-desktop/
2. Install Node.js -> https://nodejs.org/en/download/current
3. Create an AWS account -> https://aws.amazon.com/resources/create-account/
  - Login with your root account in the AWS console -> https://docs.aws.amazon.com/signin/latest/userguide/introduction-to-root-user-sign-in-tutorial.html
  - Open **IAM** service and create an IAM user with **console and programmatic access** and provide
  - Set permissions -> select **Attach policies directly** and add *AdministratorAccess* to the IAM user
  - **IMPORTANT** - make sure to save the IAM username, password, access key and secret keys as they are needed in later steps
4. Install AWS CLI -> https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
5. Open a terminal
  - run **aws configure --profile *[your-iam-username]*** and input the required values
6. Install AWS CDK -> run **npm install -g aws-cdk**
7. Install Typescript -> run **npm install -g typescript**
8. Run **aws sts get-caller-identity --profile *[your-iam-username]***
  - *Account* value needed for Deployment Step 2
9. Run **aws configure get region --profile *[your-iam-username]***
  - Value needed for Deployment Step 2

# Deployment
1. Open a terminal and cd into project root directory
2. Run **cdk bootstrap aws://*[Account]*/*[Region]* --profile *[your-iam-username]***
3. Run **cdk deploy --all --profile *[your-iam-username]***