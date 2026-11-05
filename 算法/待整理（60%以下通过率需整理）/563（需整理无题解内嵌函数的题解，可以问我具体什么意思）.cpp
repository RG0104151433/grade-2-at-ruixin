/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int getSum(TreeNode* root) { // 记录包含该节点的节点和
        if (root==nullptr) return 0;
        int sum=root->val;
        if (root->left!=nullptr) sum+=getSum(root->left);
        if (root->right!=nullptr) sum+=getSum(root->right);
        return sum;
    }
    void tilt(TreeNode* root,int& ans) {
        if (root==nullptr || root->left==nullptr && root->right==nullptr) return ;
        int left=0,right=0;
        if (root->left!=nullptr) left=getSum(root->left);
        if (root->right!=nullptr) right=getSum(root->right);
        ans+=abs(left-right);
        if (root->left!=nullptr) tilt(root->left,ans);
        if (root->right!=nullptr) tilt(root->right,ans);
    }
    int findTilt(TreeNode* root) {
        int ans=0;
        tilt(root,ans);
        return ans;
    }
};
