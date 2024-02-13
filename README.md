# Overview
This project is a mock product ordering workflow built with AWS CDK, Node.js and Typescript.
The automated system is deployed via CDK to AWS Lambda functions which are chained in a Step Function state machine for order automation. Other services used are S3, DynamoDB, CloudWatch, IAM, API Gateway, Simple Email Service and CloudFormation.

All of these services are included in the AWS Free Tier and will not incur charges as long as the resource usage stays within AWS's free tier limit.

# Prerequisites
1. Install Docker -> https://www.docker.com/products/docker-desktop/
2. Install Node.js -> https://nodejs.org/en/download/current
3. Create an AWS account -> https://aws.amazon.com/resources/create-account/
  - Login with your root account in the AWS console -> https://docs.aws.amazon.com/signin/latest/userguide/introduction-to-root-user-sign-in-tutorial.html
  - Open **IAM** service and create an IAM user with **console and programmatic access**
  - Set permissions -> select **Attach policies directly** and add *AdministratorAccess* to the IAM user
  - **IMPORTANT** - make sure to save the IAM username, password, access key and secret keys as they are needed in later steps
4. Install AWS CLI -> https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
5. Open a terminal
  - run **aws configure --profile *[your-iam-username]*** and input the required values (use *eu-central-1* when asked for region)
6. Install AWS CDK -> run **npm install -g aws-cdk**
7. Install Typescript -> run **npm install -g typescript**
8. Run **aws sts get-caller-identity --profile *[your-iam-username]***
  - *Account* value needed for Deployment Step 2
9. Run **aws configure get region --profile *[your-iam-username]***
  - Value needed for Deployment Step 2

# Deployment
1. Open a terminal and cd into project root directory
2. Run **cdk bootstrap aws://*[Account]*/*[Region]* --profile *[your-iam-username]***
3. Open **lib/common/constants.ts**
  - set *senderEmail* and *recepientEmail* values for testing the application (can be the same email)
4. Run **cdk deploy --all --profile *[your-iam-username]***
  - **Note**: monitor your terminal as CDK will require confirmation for every stack deployment
5. Open the email account/s you used in step 3 above and verify the email address/es (you should have received an email from AWS with a link to verify)
6. Wait for deployment to finish and copy the **TriggerWorkflowStack.ApiEndpoint** url from the output of your terminal for later use in Postman
7. **DELETING SERVICES** - run **cdk destroy --all --profile *[your-iam-username]***

# Test scenarios
All test scenarios are triggered via Postman. Import the request collection you'll need from **./test/postman-collection** and replace *{deployed-api-url}* with the url you copied from **Deployment step 6**.

## Prerequisite
Login to the AWS Management Console with the **IAM user** you created in **Prerequisites step 3** and open **S3** service. Open the **update-products-bucket** and upload **Products.xlsx** which you'll find in **./test/data**.

Open **Step Functions** in the AWS Management Console and open the **orders-workflow** state machine. At the bottom of the dashboard you'll see *'Executions'* - this is where you'll monitor your automated workflow's executions in real time after triggering each scenario.

## Scenario 1 - successful order
1. Open Postman and send the *Successful order* request

## Scenario 2 - product not yet available
1. Open Postman and send the *Product not yet available request*
2. Open the state machine - stuck in wait/loop state
2. Open the **Products.xlsx** file and set the **Available** field's value to **TRUE** for row with **Id** **p4**
3. Upload the excel sheet in S3 as described in **Prerequisite above**
4. Open the state machine again - order successful

## Scenario 3 - manual decision
1. Open Postman and send the *Product not yet available request*
2. Open the state machine - paused on *Waiting for manual decision*
3. Open your recipient email you set in **constants.ts** in **Deployment step 3** and open the email you should have received from AWS
4. Decide whether to approve or reject the order
5. Open the state machine - state machine should have resulted in Success or Failure depending on your choice